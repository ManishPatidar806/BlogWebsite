"""
API v1 Router - Aggregates all API routes
"""

from fastapi import APIRouter

from app.api.v1.routes import auth, users, posts, tags, categories, comments, ai, uploads, courses

router = APIRouter()

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(posts.router, prefix="/posts", tags=["Posts"])
router.include_router(tags.router, prefix="/tags", tags=["Tags"])
router.include_router(categories.router, prefix="/categories", tags=["Categories"])
router.include_router(comments.router, prefix="/comments", tags=["Comments"])
router.include_router(ai.router, prefix="/ai", tags=["AI"])
router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
router.include_router(courses.router, prefix="/courses", tags=["LMS Courses"])
