"""
Posts API routes
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.database import get_db
from app.auth.auth import get_current_active_user, get_current_writer, get_optional_current_user
from app.models.models import User, PostStatus
from app.schemas.schemas import (
    PostCreate, PostUpdate, PostResponse, PostWithRelations,
    PostListResponse, DraftCreate, DraftResponse, MessageResponse
)
from app.services.post_service import PostService


router = APIRouter()


@router.get("", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: Optional[str] = None,
    tag: Optional[str] = None,
    category: Optional[str] = None,
    featured: bool = False,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all published posts with pagination and filtering.
    
    - **page**: Page number (starting from 1)
    - **page_size**: Number of posts per page (max 50)
    - **search**: Search in title, excerpt, and content
    - **tag**: Filter by tag slug
    - **category**: Filter by category slug
    - **featured**: Show only featured posts
    """
    service = PostService(db)
    
    return await service.list_posts(
        page=page,
        page_size=page_size,
        status=PostStatus.PUBLISHED,
        tag_slug=tag,
        category_slug=category,
        search=search,
        featured_only=featured,
        current_user_id=current_user.id if current_user else None
    )


@router.get("/my", response_model=PostListResponse)
async def list_my_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """
    List current user's posts (drafts and published).
    
    Requires writer role.
    """
    service = PostService(db)
    
    post_status = None
    if status:
        try:
            post_status = PostStatus(status)
        except ValueError:
            pass
    
    return await service.list_posts(
        page=page,
        page_size=page_size,
        status=post_status,
        author_id=current_user.id,
        current_user_id=current_user.id
    )


@router.get("/bookmarks", response_model=PostListResponse)
async def list_bookmarks(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's bookmarked posts"""
    service = PostService(db)
    
    return await service.get_user_bookmarks(
        user_id=current_user.id,
        page=page,
        page_size=page_size
    )


@router.get("/author/{username}", response_model=PostListResponse)
async def list_author_posts(
    username: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List published posts by a specific author"""
    from app.services.user_service import UserService
    
    user_service = UserService(db)
    author = await user_service.get_user_by_username(username)
    
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Author not found"
        )
    
    post_service = PostService(db)
    
    return await post_service.list_posts(
        page=page,
        page_size=page_size,
        status=PostStatus.PUBLISHED,
        author_id=author.id,
        current_user_id=current_user.id if current_user else None
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new blog post.
    
    Requires writer role.
    """
    service = PostService(db)
    post = await service.create_post(current_user.id, post_data)
    return post


@router.get("/slug/{slug}", response_model=PostWithRelations)
async def get_post_by_slug(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single post by its slug"""
    service = PostService(db)
    
    post = await service.get_post_by_slug(
        slug=slug,
        current_user_id=current_user.id if current_user else None,
        increment_views=True
    )
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Only allow viewing published posts or own drafts
    if post.status != PostStatus.PUBLISHED:
        if not current_user or post.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
    
    return post


@router.get("/{post_id}", response_model=PostWithRelations)
async def get_post(
    post_id: UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single post by ID"""
    service = PostService(db)
    
    post = await service.get_post_by_id(
        post_id=post_id,
        current_user_id=current_user.id if current_user else None,
        increment_views=True
    )
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Only allow viewing published posts or own drafts
    if post.status != PostStatus.PUBLISHED:
        if not current_user or post.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
    
    return post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a blog post.
    
    Authors can only update their own posts.
    """
    service = PostService(db)
    
    post = await service.update_post(
        post_id=post_id,
        author_id=current_user.id,
        post_data=post_data
    )
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission to edit it"
        )
    
    return post


@router.delete("/{post_id}", response_model=MessageResponse)
async def delete_post(
    post_id: UUID,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a blog post.
    
    Authors can only delete their own posts.
    """
    service = PostService(db)
    
    success = await service.delete_post(
        post_id=post_id,
        author_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission to delete it"
        )
    
    return MessageResponse(message="Post deleted successfully")


@router.post("/{post_id}/like", response_model=dict)
async def toggle_like(
    post_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle like on a post"""
    service = PostService(db)
    
    # Verify post exists
    post = await service.get_post_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    is_liked, count = await service.toggle_like(post_id, current_user.id)
    
    return {
        "is_liked": is_liked,
        "likes_count": count
    }


@router.post("/{post_id}/bookmark", response_model=dict)
async def toggle_bookmark(
    post_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle bookmark on a post"""
    service = PostService(db)
    
    # Verify post exists
    post = await service.get_post_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    is_bookmarked = await service.toggle_bookmark(post_id, current_user.id)
    
    return {
        "is_bookmarked": is_bookmarked
    }


@router.post("/drafts", response_model=DraftResponse)
async def save_draft(
    draft_data: DraftCreate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Auto-save or manually save a draft"""
    service = PostService(db)
    
    draft = await service.save_draft(
        author_id=current_user.id,
        post_id=draft_data.post_id,
        title=draft_data.title,
        content=draft_data.content
    )
    
    return draft


@router.get("/drafts/list", response_model=list[DraftResponse])
async def list_drafts(
    post_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Get drafts for current user or specific post"""
    service = PostService(db)
    
    drafts = await service.get_drafts(
        author_id=current_user.id,
        post_id=post_id
    )
    
    return drafts
