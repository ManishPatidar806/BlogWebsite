"""
User service for user-related business logic
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.models import User, Profile, Post, Like, Comment, Bookmark, RefreshToken, UserRole, PostStatus
from app.schemas.schemas import UserCreate, UserUpdate, ProfileUpdate, AuthorStats
from app.auth.auth import hash_password, verify_password, create_access_token, create_refresh_token


class UserService:
    """Service for user operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with profile"""
        # Check if email exists
        existing_email = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_email.scalar_one_or_none():
            raise ValueError("Email already registered")
        
        # Check if username exists
        existing_username = await self.db.execute(
            select(User).where(User.username == user_data.username)
        )
        if existing_username.scalar_one_or_none():
            raise ValueError("Username already taken")
        
        # Create user
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hash_password(user_data.password),
            role=UserRole(user_data.role.value),
        )
        self.db.add(user)
        await self.db.flush()
        
        # Create empty profile
        profile = Profile(user_id=user.id, display_name=user.username)
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password"""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.hashed_password):
            return None
        
        if not user.is_active:
            return None
        
        return user
    
    async def create_tokens(self, user: User) -> dict:
        """Create access and refresh tokens for a user"""
        access_token = create_access_token(user.id)
        refresh_token, expires_at = create_refresh_token(user.id)
        
        # Store refresh token in database
        token_record = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at
        )
        self.db.add(token_record)
        await self.db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    async def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        """Refresh access token using refresh token"""
        from app.auth.auth import decode_token
        from datetime import datetime
        
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                return None
            
            user_id = UUID(payload.get("sub"))
            
            # Verify refresh token exists and is valid
            result = await self.db.execute(
                select(RefreshToken).where(
                    RefreshToken.token == refresh_token,
                    RefreshToken.is_revoked == False,
                    RefreshToken.expires_at > datetime.utcnow()
                )
            )
            token_record = result.scalar_one_or_none()
            
            if not token_record:
                return None
            
            # Get user
            user_result = await self.db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            
            if not user or not user.is_active:
                return None
            
            # Create new access token
            access_token = create_access_token(user.id)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
            
        except Exception:
            return None
    
    async def revoke_refresh_token(self, refresh_token: str) -> bool:
        """Revoke a refresh token"""
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token)
        )
        token_record = result.scalar_one_or_none()
        
        if token_record:
            token_record.is_revoked = True
            await self.db.commit()
            return True
        return False
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID with profile"""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username with profile"""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def update_user(self, user_id: UUID, user_data: UserUpdate) -> Optional[User]:
        """Update user information"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        if user_data.email and user_data.email != user.email:
            existing = await self.db.execute(
                select(User).where(User.email == user_data.email)
            )
            if existing.scalar_one_or_none():
                raise ValueError("Email already registered")
            user.email = user_data.email
        
        if user_data.username and user_data.username != user.username:
            existing = await self.db.execute(
                select(User).where(User.username == user_data.username)
            )
            if existing.scalar_one_or_none():
                raise ValueError("Username already taken")
            user.username = user_data.username
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update_profile(self, user_id: UUID, profile_data: ProfileUpdate) -> Optional[Profile]:
        """Update user profile"""
        result = await self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            # Create profile if doesn't exist
            profile = Profile(user_id=user_id)
            self.db.add(profile)
        
        # Update fields
        for field, value in profile_data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        
        await self.db.commit()
        await self.db.refresh(profile)
        return profile
    
    async def get_author_stats(self, user_id: UUID) -> AuthorStats:
        """Get statistics for an author"""
        # Total posts
        total_posts_result = await self.db.execute(
            select(func.count(Post.id)).where(Post.author_id == user_id)
        )
        total_posts = total_posts_result.scalar() or 0
        
        # Published posts
        published_result = await self.db.execute(
            select(func.count(Post.id)).where(
                Post.author_id == user_id,
                Post.status == PostStatus.PUBLISHED
            )
        )
        published_posts = published_result.scalar() or 0
        
        # Draft posts
        draft_result = await self.db.execute(
            select(func.count(Post.id)).where(
                Post.author_id == user_id,
                Post.status == PostStatus.DRAFT
            )
        )
        draft_posts = draft_result.scalar() or 0
        
        # Total views
        views_result = await self.db.execute(
            select(func.sum(Post.views)).where(Post.author_id == user_id)
        )
        total_views = views_result.scalar() or 0
        
        # Total likes on user's posts
        likes_result = await self.db.execute(
            select(func.count(Like.id))
            .join(Post, Like.post_id == Post.id)
            .where(Post.author_id == user_id)
        )
        total_likes = likes_result.scalar() or 0
        
        # Total comments on user's posts
        comments_result = await self.db.execute(
            select(func.count(Comment.id))
            .join(Post, Comment.post_id == Post.id)
            .where(Post.author_id == user_id)
        )
        total_comments = comments_result.scalar() or 0
        
        # Total bookmarks on user's posts
        bookmarks_result = await self.db.execute(
            select(func.count(Bookmark.id))
            .join(Post, Bookmark.post_id == Post.id)
            .where(Post.author_id == user_id)
        )
        total_bookmarks = bookmarks_result.scalar() or 0
        
        return AuthorStats(
            total_posts=total_posts,
            published_posts=published_posts,
            draft_posts=draft_posts,
            total_views=total_views,
            total_likes=total_likes,
            total_comments=total_comments,
            total_bookmarks=total_bookmarks
        )
    
    async def change_password(self, user_id: UUID, current_password: str, new_password: str) -> bool:
        """Change user password"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            return False
        
        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")
        
        user.hashed_password = hash_password(new_password)
        await self.db.commit()
        return True
