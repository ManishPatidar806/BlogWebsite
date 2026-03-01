"""
Post service for blog post operations
"""

from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.models.models import (
    Post, User, Tag, Category, Like, Bookmark, Comment, Draft, PostStatus
)
from app.schemas.schemas import PostCreate, PostUpdate, PostWithRelations, PostListResponse


class PostService:
    """Service for post operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def _generate_slug(self, title: str, suffix: Optional[str] = None) -> str:
        """Generate a URL-safe slug from title"""
        base_slug = slugify(title, max_length=250)
        if suffix:
            return f"{base_slug}-{suffix}"
        return base_slug
    
    async def _ensure_unique_slug(self, slug: str, exclude_id: Optional[UUID] = None) -> str:
        """Ensure slug is unique, append suffix if needed"""
        base_slug = slug
        counter = 1
        
        while True:
            query = select(Post).where(Post.slug == slug)
            if exclude_id:
                query = query.where(Post.id != exclude_id)
            
            result = await self.db.execute(query)
            if not result.scalar_one_or_none():
                return slug
            
            slug = f"{base_slug}-{counter}"
            counter += 1
    
    def _calculate_reading_time(self, content: str) -> int:
        """Calculate reading time in minutes (avg 200 words per minute)"""
        word_count = len(content.split())
        return max(1, word_count // 200)
    
    def _count_words(self, content: str) -> int:
        """Count words in content"""
        return len(content.split())
    
    async def create_post(self, author_id: UUID, post_data: PostCreate) -> Post:
        """Create a new blog post"""
        # Generate unique slug
        slug = self._generate_slug(post_data.title)
        slug = await self._ensure_unique_slug(slug)
        
        # Calculate metrics
        word_count = self._count_words(post_data.content)
        reading_time = self._calculate_reading_time(post_data.content)
        
        # Determine published_at
        published_at = None
        if post_data.status == PostStatus.PUBLISHED:
            published_at = datetime.utcnow()
        
        # Create post
        post = Post(
            author_id=author_id,
            title=post_data.title,
            slug=slug,
            excerpt=post_data.excerpt,
            content=post_data.content,
            cover_image=post_data.cover_image,
            status=PostStatus(post_data.status.value),
            is_featured=post_data.is_featured,
            word_count=word_count,
            reading_time=reading_time,
            published_at=published_at
        )
        
        self.db.add(post)
        await self.db.flush()
        
        # Add tags
        if post_data.tag_ids:
            tags_result = await self.db.execute(
                select(Tag).where(Tag.id.in_(post_data.tag_ids))
            )
            post.tags = list(tags_result.scalars().all())
        
        # Add categories
        if post_data.category_ids:
            categories_result = await self.db.execute(
                select(Category).where(Category.id.in_(post_data.category_ids))
            )
            post.categories = list(categories_result.scalars().all())
        
        await self.db.commit()
        await self.db.refresh(post)
        
        return post
    
    async def update_post(
        self, 
        post_id: UUID, 
        author_id: UUID, 
        post_data: PostUpdate,
        is_admin: bool = False
    ) -> Optional[Post]:
        """Update an existing post"""
        query = select(Post).options(
            selectinload(Post.tags),
            selectinload(Post.categories)
        ).where(Post.id == post_id)
        if not is_admin:
            query = query.where(Post.author_id == author_id)
        
        result = await self.db.execute(query)
        post = result.scalar_one_or_none()
        
        if not post:
            return None
        
        # Update fields
        update_data = post_data.model_dump(exclude_unset=True)
        
        if "title" in update_data:
            post.title = update_data["title"]
            # Update slug only if title changed significantly
            new_slug = self._generate_slug(update_data["title"])
            if new_slug != post.slug:
                post.slug = await self._ensure_unique_slug(new_slug, exclude_id=post.id)
        
        if "content" in update_data:
            post.content = update_data["content"]
            post.word_count = self._count_words(update_data["content"])
            post.reading_time = self._calculate_reading_time(update_data["content"])
        
        if "excerpt" in update_data:
            post.excerpt = update_data["excerpt"]
        
        if "cover_image" in update_data:
            post.cover_image = update_data["cover_image"]
        
        if "is_featured" in update_data:
            post.is_featured = update_data["is_featured"]
        
        if "status" in update_data:
            new_status = PostStatus(update_data["status"].value)
            if new_status == PostStatus.PUBLISHED and post.status != PostStatus.PUBLISHED:
                post.published_at = datetime.utcnow()
            post.status = new_status
        
        if "tag_ids" in update_data:
            if update_data["tag_ids"]:
                tags_result = await self.db.execute(
                    select(Tag).where(Tag.id.in_(update_data["tag_ids"]))
                )
                post.tags = list(tags_result.scalars().all())
            else:
                post.tags = []
        
        if "category_ids" in update_data:
            if update_data["category_ids"]:
                categories_result = await self.db.execute(
                    select(Category).where(Category.id.in_(update_data["category_ids"]))
                )
                post.categories = list(categories_result.scalars().all())
            else:
                post.categories = []
        
        await self.db.commit()
        await self.db.refresh(post)
        
        return post
    
    async def delete_post(self, post_id: UUID, author_id: UUID, is_admin: bool = False) -> bool:
        """Delete a post"""
        query = select(Post).where(Post.id == post_id)
        if not is_admin:
            query = query.where(Post.author_id == author_id)
        
        result = await self.db.execute(query)
        post = result.scalar_one_or_none()
        
        if not post:
            return False
        
        await self.db.delete(post)
        await self.db.commit()
        return True
    
    async def get_post_by_id(
        self, 
        post_id: UUID,
        current_user_id: Optional[UUID] = None,
        increment_views: bool = False
    ) -> Optional[PostWithRelations]:
        """Get a single post by ID with all relations"""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.tags),
                selectinload(Post.categories),
            )
            .where(Post.id == post_id)
        )
        post = result.scalar_one_or_none()
        
        if not post:
            return None
        
        if increment_views:
            post.views += 1
            await self.db.commit()
        
        return await self._enrich_post(post, current_user_id)
    
    async def get_post_by_slug(
        self, 
        slug: str,
        current_user_id: Optional[UUID] = None,
        increment_views: bool = True
    ) -> Optional[PostWithRelations]:
        """Get a single post by slug"""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.tags),
                selectinload(Post.categories),
            )
            .where(Post.slug == slug)
        )
        post = result.scalar_one_or_none()
        
        if not post:
            return None
        
        if increment_views:
            post.views += 1
            await self.db.commit()
        
        return await self._enrich_post(post, current_user_id)
    
    async def _enrich_post(
        self, 
        post: Post, 
        current_user_id: Optional[UUID] = None
    ) -> PostWithRelations:
        """Enrich post with counts and user-specific data"""
        # Get counts
        likes_count = await self.db.execute(
            select(func.count(Like.id)).where(Like.post_id == post.id)
        )
        comments_count = await self.db.execute(
            select(func.count(Comment.id)).where(Comment.post_id == post.id)
        )
        
        is_liked = False
        is_bookmarked = False
        
        if current_user_id:
            # Check if user liked
            liked = await self.db.execute(
                select(Like).where(
                    Like.post_id == post.id,
                    Like.user_id == current_user_id
                )
            )
            is_liked = liked.scalar_one_or_none() is not None
            
            # Check if user bookmarked
            bookmarked = await self.db.execute(
                select(Bookmark).where(
                    Bookmark.post_id == post.id,
                    Bookmark.user_id == current_user_id
                )
            )
            is_bookmarked = bookmarked.scalar_one_or_none() is not None
        
        return PostWithRelations(
            id=post.id,
            author_id=post.author_id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content=post.content,
            cover_image=post.cover_image,
            status=post.status,
            reading_time=post.reading_time,
            word_count=post.word_count,
            views=post.views,
            is_featured=post.is_featured,
            published_at=post.published_at,
            created_at=post.created_at,
            updated_at=post.updated_at,
            author=post.author,
            tags=list(post.tags),
            categories=list(post.categories),
            likes_count=likes_count.scalar() or 0,
            comments_count=comments_count.scalar() or 0,
            is_liked=is_liked,
            is_bookmarked=is_bookmarked
        )
    
    async def list_posts(
        self,
        page: int = 1,
        page_size: int = 10,
        status: Optional[PostStatus] = PostStatus.PUBLISHED,
        author_id: Optional[UUID] = None,
        tag_slug: Optional[str] = None,
        category_slug: Optional[str] = None,
        search: Optional[str] = None,
        featured_only: bool = False,
        current_user_id: Optional[UUID] = None
    ) -> PostListResponse:
        """List posts with filtering and pagination"""
        # Base query
        query = (
            select(Post)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.tags),
                selectinload(Post.categories),
            )
        )
        
        # Filters
        conditions = []
        
        if status:
            conditions.append(Post.status == status)
        
        if author_id:
            conditions.append(Post.author_id == author_id)
        
        if featured_only:
            conditions.append(Post.is_featured == True)
        
        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    Post.title.ilike(search_term),
                    Post.excerpt.ilike(search_term),
                    Post.content.ilike(search_term)
                )
            )
        
        if tag_slug:
            query = query.join(Post.tags).where(Tag.slug == tag_slug)
        
        if category_slug:
            query = query.join(Post.categories).where(Category.slug == category_slug)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Count total
        count_query = select(func.count(func.distinct(Post.id))).select_from(Post)
        if conditions:
            count_query = count_query.where(and_(*conditions))
        if tag_slug:
            count_query = count_query.join(Post.tags).where(Tag.slug == tag_slug)
        if category_slug:
            count_query = count_query.join(Post.categories).where(Category.slug == category_slug)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Pagination
        offset = (page - 1) * page_size
        query = query.order_by(desc(Post.published_at), desc(Post.created_at))
        query = query.offset(offset).limit(page_size)
        
        result = await self.db.execute(query)
        posts = result.scalars().unique().all()
        
        # Enrich posts
        enriched_posts = []
        for post in posts:
            enriched = await self._enrich_post(post, current_user_id)
            enriched_posts.append(enriched)
        
        total_pages = (total + page_size - 1) // page_size
        
        return PostListResponse(
            items=enriched_posts,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    async def toggle_like(self, post_id: UUID, user_id: UUID) -> Tuple[bool, int]:
        """Toggle like on a post, returns (is_liked, likes_count)"""
        # Check if already liked
        result = await self.db.execute(
            select(Like).where(
                Like.post_id == post_id,
                Like.user_id == user_id
            )
        )
        existing_like = result.scalar_one_or_none()
        
        if existing_like:
            await self.db.delete(existing_like)
            await self.db.commit()
            is_liked = False
        else:
            like = Like(post_id=post_id, user_id=user_id)
            self.db.add(like)
            await self.db.commit()
            is_liked = True
        
        # Get updated count
        count_result = await self.db.execute(
            select(func.count(Like.id)).where(Like.post_id == post_id)
        )
        count = count_result.scalar() or 0
        
        return is_liked, count
    
    async def toggle_bookmark(self, post_id: UUID, user_id: UUID) -> bool:
        """Toggle bookmark on a post, returns is_bookmarked"""
        result = await self.db.execute(
            select(Bookmark).where(
                Bookmark.post_id == post_id,
                Bookmark.user_id == user_id
            )
        )
        existing_bookmark = result.scalar_one_or_none()
        
        if existing_bookmark:
            await self.db.delete(existing_bookmark)
            await self.db.commit()
            return False
        else:
            bookmark = Bookmark(post_id=post_id, user_id=user_id)
            self.db.add(bookmark)
            await self.db.commit()
            return True
    
    async def get_user_bookmarks(
        self, 
        user_id: UUID, 
        page: int = 1, 
        page_size: int = 10
    ) -> PostListResponse:
        """Get user's bookmarked posts"""
        # Count total
        count_result = await self.db.execute(
            select(func.count(Bookmark.id)).where(Bookmark.user_id == user_id)
        )
        total = count_result.scalar() or 0
        
        # Get bookmarks
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Post)
            .join(Bookmark, Bookmark.post_id == Post.id)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.tags),
                selectinload(Post.categories),
            )
            .where(Bookmark.user_id == user_id)
            .order_by(desc(Bookmark.created_at))
            .offset(offset)
            .limit(page_size)
        )
        posts = result.scalars().all()
        
        # Enrich posts
        enriched_posts = []
        for post in posts:
            enriched = await self._enrich_post(post, user_id)
            enriched_posts.append(enriched)
        
        total_pages = (total + page_size - 1) // page_size
        
        return PostListResponse(
            items=enriched_posts,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    async def save_draft(self, author_id: UUID, post_id: Optional[UUID], title: str, content: str) -> Draft:
        """Save or update a draft"""
        if post_id:
            # Get latest version for this post
            result = await self.db.execute(
                select(Draft)
                .where(Draft.post_id == post_id, Draft.author_id == author_id)
                .order_by(desc(Draft.version))
                .limit(1)
            )
            latest_draft = result.scalar_one_or_none()
            version = (latest_draft.version + 1) if latest_draft else 1
        else:
            version = 1
        
        draft = Draft(
            post_id=post_id,
            author_id=author_id,
            title=title,
            content=content,
            version=version
        )
        self.db.add(draft)
        await self.db.commit()
        await self.db.refresh(draft)
        
        return draft
    
    async def get_drafts(self, author_id: UUID, post_id: Optional[UUID] = None) -> List[Draft]:
        """Get drafts for a user or specific post"""
        query = select(Draft).where(Draft.author_id == author_id)
        
        if post_id:
            query = query.where(Draft.post_id == post_id)
        
        query = query.order_by(desc(Draft.created_at))
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
