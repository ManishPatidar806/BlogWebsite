"""
Categories API routes
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from slugify import slugify

from app.db.database import get_db
from app.auth.auth import get_current_admin, get_current_writer
from app.models.models import Category, User, Post, PostStatus, post_categories
from app.schemas.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse, 
    CategoryWithPosts, PostSidebarItem, PostWithRelations
)


router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Get all categories"""
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    return list(categories)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a single category by ID"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new category (admin only)"""
    slug = slugify(category_data.name)
    
    # Check if category exists
    result = await db.execute(select(Category).where(Category.slug == slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists"
        )
    
    # Verify parent exists if provided
    if category_data.parent_id:
        parent_result = await db.execute(
            select(Category).where(Category.id == category_data.parent_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found"
            )
    
    category = Category(
        name=category_data.name,
        slug=slug,
        description=category_data.description,
        icon=category_data.icon,
        parent_id=category_data.parent_id
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a category (admin only)"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    if category_data.name:
        category.name = category_data.name
        category.slug = slugify(category_data.name)
    
    if category_data.description is not None:
        category.description = category_data.description
    
    if category_data.icon is not None:
        category.icon = category_data.icon
    
    if category_data.parent_id is not None:
        # Prevent self-reference
        if category_data.parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category cannot be its own parent"
            )
        category.parent_id = category_data.parent_id
    
    await db.commit()
    await db.refresh(category)
    
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a category (admin only)"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    await db.delete(category)
    await db.commit()


# ============== W3Schools-style Tutorial Endpoints ==============

@router.get("/slug/{category_slug}", response_model=CategoryWithPosts)
async def get_category_with_posts(
    category_slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a category by slug with all published posts for sidebar.
    Used for W3Schools-style tutorial layout.
    """
    # Get category
    result = await db.execute(
        select(Category).where(Category.slug == category_slug)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Get published posts in this category
    posts_query = (
        select(Post)
        .join(post_categories, Post.id == post_categories.c.post_id)
        .where(
            post_categories.c.category_id == category.id,
            Post.status == PostStatus.PUBLISHED
        )
        .order_by(Post.created_at.asc())  # Order by creation date (oldest first)
    )
    posts_result = await db.execute(posts_query)
    posts = posts_result.scalars().all()
    
    # Build response
    posts_list = [
        PostSidebarItem(
            id=post.id,
            title=post.title,
            slug=post.slug
        )
        for post in posts
    ]
    
    return CategoryWithPosts(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        icon=category.icon,
        parent_id=category.parent_id,
        created_at=category.created_at,
        posts_count=len(posts_list),
        posts=posts_list
    )


@router.get("/slug/{category_slug}/post/{post_slug}", response_model=PostWithRelations)
async def get_post_in_category(
    category_slug: str,
    post_slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific post within a category.
    Used for W3Schools-style tutorial layout.
    """
    # Verify category exists
    cat_result = await db.execute(
        select(Category).where(Category.slug == category_slug)
    )
    category = cat_result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Get the post
    post_query = (
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.tags),
            selectinload(Post.categories)
        )
        .join(post_categories, Post.id == post_categories.c.post_id)
        .where(
            post_categories.c.category_id == category.id,
            Post.slug == post_slug,
            Post.status == PostStatus.PUBLISHED
        )
    )
    result = await db.execute(post_query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found in this category"
        )
    
    # Increment views
    post.views += 1
    await db.commit()
    await db.refresh(post)
    
    return post


@router.get("/slug/{category_slug}/first", response_model=PostWithRelations)
async def get_first_post_in_category(
    category_slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the first (oldest) post in a category.
    Used when navigating to a category without specifying a post.
    """
    # Verify category exists
    cat_result = await db.execute(
        select(Category).where(Category.slug == category_slug)
    )
    category = cat_result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Get the first post (oldest)
    post_query = (
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.tags),
            selectinload(Post.categories)
        )
        .join(post_categories, Post.id == post_categories.c.post_id)
        .where(
            post_categories.c.category_id == category.id,
            Post.status == PostStatus.PUBLISHED
        )
        .order_by(Post.created_at.asc())
        .limit(1)
    )
    result = await db.execute(post_query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No posts found in this category"
        )
    
    # Increment views
    post.views += 1
    await db.commit()
    await db.refresh(post)
    
    return post
