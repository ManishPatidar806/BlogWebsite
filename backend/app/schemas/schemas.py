"""
Pydantic schemas for API validation and serialization
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from enum import Enum


# Enums
class UserRoleEnum(str, Enum):
    READER = "reader"
    WRITER = "writer"
    ADMIN = "admin"


class PostStatusEnum(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# ============== Authentication Schemas ==============

class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str
    exp: datetime
    type: str


# ============== User Schemas ==============

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRoleEnum = UserRoleEnum.READER


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user info"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)


class UserPasswordUpdate(BaseModel):
    """Schema for password update"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    """User response schema"""
    id: UUID
    role: UserRoleEnum
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserWithProfile(UserResponse):
    """User with profile data"""
    profile: Optional["ProfileResponse"] = None


# ============== Profile Schemas ==============

class ProfileBase(BaseModel):
    """Base profile schema"""
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    twitter_handle: Optional[str] = Field(None, max_length=50)
    github_handle: Optional[str] = Field(None, max_length=50)
    linkedin_url: Optional[str] = None


class ProfileCreate(ProfileBase):
    """Profile creation schema"""
    pass


class ProfileUpdate(ProfileBase):
    """Profile update schema"""
    pass


class ProfileResponse(ProfileBase):
    """Profile response schema"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============== Tag Schemas ==============

class TagBase(BaseModel):
    """Base tag schema"""
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class TagCreate(TagBase):
    """Tag creation schema"""
    pass


class TagUpdate(BaseModel):
    """Tag update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class TagResponse(TagBase):
    """Tag response schema"""
    id: UUID
    slug: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============== Category Schemas ==============

class CategoryBase(BaseModel):
    """Base category schema"""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Category creation schema"""
    parent_id: Optional[UUID] = None


class CategoryUpdate(BaseModel):
    """Category update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[UUID] = None


class CategoryResponse(CategoryBase):
    """Category response schema"""
    id: UUID
    slug: str
    parent_id: Optional[UUID]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============== Post Schemas ==============

class PostBase(BaseModel):
    """Base post schema"""
    title: str = Field(..., min_length=1, max_length=255)
    excerpt: Optional[str] = None
    content: str = Field(..., min_length=1)
    cover_image: Optional[str] = Field(None, max_length=2000)
    is_featured: bool = False


class PostCreate(PostBase):
    """Post creation schema"""
    status: PostStatusEnum = PostStatusEnum.DRAFT
    tag_ids: Optional[List[UUID]] = []
    category_ids: Optional[List[UUID]] = []


class PostUpdate(BaseModel):
    """Post update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[PostStatusEnum] = None
    is_featured: Optional[bool] = None
    tag_ids: Optional[List[UUID]] = None
    category_ids: Optional[List[UUID]] = None


class PostResponse(PostBase):
    """Post response schema"""
    id: UUID
    author_id: UUID
    slug: str
    status: PostStatusEnum
    reading_time: int
    word_count: int
    views: int
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PostWithRelations(PostResponse):
    """Post with author and tags"""
    author: Optional[UserResponse] = None
    tags: List[TagResponse] = []
    categories: List[CategoryResponse] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    is_bookmarked: bool = False


class PostListResponse(BaseModel):
    """Paginated post list response"""
    items: List[PostWithRelations]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============== Draft Schemas ==============

class DraftCreate(BaseModel):
    """Draft creation schema"""
    post_id: Optional[UUID] = None
    title: str
    content: str


class DraftResponse(BaseModel):
    """Draft response schema"""
    id: UUID
    post_id: Optional[UUID]
    author_id: UUID
    title: str
    content: str
    version: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============== Comment Schemas ==============

class CommentBase(BaseModel):
    """Base comment schema"""
    content: str = Field(..., min_length=1, max_length=2000)


class CommentCreate(CommentBase):
    """Comment creation schema"""
    parent_id: Optional[UUID] = None


class CommentUpdate(BaseModel):
    """Comment update schema"""
    content: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(CommentBase):
    """Comment response schema"""
    id: UUID
    post_id: UUID
    author_id: UUID
    parent_id: Optional[UUID]
    is_edited: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[UserResponse] = None
    replies: List["CommentResponse"] = []
    
    model_config = ConfigDict(from_attributes=True)


# ============== Like & Bookmark Schemas ==============

class LikeResponse(BaseModel):
    """Like response schema"""
    id: UUID
    user_id: UUID
    post_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class BookmarkResponse(BaseModel):
    """Bookmark response schema"""
    id: UUID
    user_id: UUID
    post_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============== AI Schemas ==============

class AITextRequest(BaseModel):
    """Request for AI text processing"""
    text: str = Field(..., min_length=1, max_length=10000)


class AIImproveRequest(AITextRequest):
    """Request for AI text improvement"""
    style: Optional[str] = Field(None, description="Style: professional, casual, academic, concise")


class AIRewriteRequest(AITextRequest):
    """Request for AI text rewrite"""
    tone: Optional[str] = Field(None, description="Tone: formal, friendly, persuasive, neutral")


class AITitleRequest(BaseModel):
    """Request for AI title suggestion"""
    content: str = Field(..., min_length=10, max_length=10000)
    current_title: Optional[str] = None


class AIResponse(BaseModel):
    """AI processing response"""
    original: str
    result: str
    action: str
    confidence: Optional[float] = None


class AITitleResponse(BaseModel):
    """AI title suggestion response"""
    suggestions: List[str]


# ============== Stats Schemas ==============

class AuthorStats(BaseModel):
    """Author statistics"""
    total_posts: int
    published_posts: int
    draft_posts: int
    total_views: int
    total_likes: int
    total_comments: int
    total_bookmarks: int


class PostStats(BaseModel):
    """Individual post statistics"""
    views: int
    likes: int
    comments: int
    bookmarks: int


# ============== Utility Schemas ==============

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_code: Optional[str] = None


# Update forward references
UserWithProfile.model_rebuild()
CommentResponse.model_rebuild()
