"""
Comments API routes
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.db.database import get_db
from app.auth.auth import get_current_active_user, get_optional_current_user
from app.models.models import Comment, Post, User
from app.schemas.schemas import CommentCreate, CommentUpdate, CommentResponse, MessageResponse


router = APIRouter()


@router.get("/post/{post_id}", response_model=List[CommentResponse])
async def list_post_comments(
    post_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all comments for a post"""
    # Verify post exists
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    if not post_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get top-level comments with replies
    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.author).selectinload(User.profile),
            selectinload(Comment.replies).selectinload(Comment.author).selectinload(User.profile)
        )
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    
    return list(comments)


@router.post("/post/{post_id}", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new comment on a post"""
    # Verify post exists
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    if not post_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Verify parent comment exists if replying
    if comment_data.parent_id:
        parent_result = await db.execute(
            select(Comment).where(
                Comment.id == comment_data.parent_id,
                Comment.post_id == post_id
            )
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment not found"
            )
    
    comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        content=comment_data.content,
        parent_id=comment_data.parent_id
    )
    db.add(comment)
    await db.commit()
    
    # Reload with author
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author).selectinload(User.profile))
        .where(Comment.id == comment.id)
    )
    comment = result.scalar_one()
    
    return comment


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a comment (author only)"""
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author).selectinload(User.profile))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments"
        )
    
    comment.content = comment_data.content
    comment.is_edited = True
    
    await db.commit()
    await db.refresh(comment)
    
    return comment


@router.delete("/{comment_id}", response_model=MessageResponse)
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a comment (author or post author only)"""
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.post))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Allow comment author or post author to delete
    if comment.author_id != current_user.id and comment.post.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this comment"
        )
    
    await db.delete(comment)
    await db.commit()
    
    return MessageResponse(message="Comment deleted successfully")
