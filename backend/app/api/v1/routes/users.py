"""
User API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.database import get_db
from app.auth.auth import get_current_active_user
from app.models.models import User
from app.schemas.schemas import (
    UserResponse, UserWithProfile, UserUpdate, 
    ProfileUpdate, ProfileResponse, 
    UserPasswordUpdate, AuthorStats, MessageResponse
)
from app.services.user_service import UserService


router = APIRouter()


@router.get("/me", response_model=UserWithProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user's profile"""
    service = UserService(db)
    user = await service.get_user_by_id(current_user.id)
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's account information"""
    service = UserService(db)
    
    try:
        user = await service.update_user(current_user.id, user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/me/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    service = UserService(db)
    profile = await service.update_profile(current_user.id, profile_data)
    return profile


@router.put("/me/password", response_model=MessageResponse)
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Change current user's password"""
    service = UserService(db)
    
    try:
        await service.change_password(
            current_user.id,
            password_data.current_password,
            password_data.new_password
        )
        return MessageResponse(message="Password updated successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me/stats", response_model=AuthorStats)
async def get_my_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's author statistics"""
    service = UserService(db)
    stats = await service.get_author_stats(current_user.id)
    return stats


@router.get("/{username}", response_model=UserWithProfile)
async def get_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """Get public user profile by username"""
    service = UserService(db)
    user = await service.get_user_by_username(username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/{username}/stats", response_model=AuthorStats)
async def get_user_stats(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """Get author statistics for a user"""
    service = UserService(db)
    user = await service.get_user_by_username(username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    stats = await service.get_author_stats(user.id)
    return stats
