"""
LMS Courses and Lessons API routes
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from slugify import slugify

from app.db.database import get_db
from app.auth.auth import get_current_user, get_current_writer, get_optional_current_user
from app.models.models import Course, Lesson, User, UserRole
from app.schemas.schemas import (
    CourseCreate, CourseUpdate, CourseResponse, CourseWithAuthor, CourseWithLessons,
    CourseSidebarItem, LessonCreate, LessonUpdate, LessonResponse, LessonWithContent,
    LessonSidebarItem, MessageResponse
)


router = APIRouter()


# ============== Helper Functions ==============

def calculate_reading_time(content: str) -> int:
    """Calculate reading time in minutes based on word count"""
    words = len(content.split())
    return max(1, words // 200)


def generate_unique_slug(base_slug: str, existing_slugs: List[str]) -> str:
    """Generate a unique slug by appending numbers if needed"""
    slug = base_slug
    counter = 1
    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


# ============== Public Course Routes ==============

@router.get("/public", response_model=List[CourseWithAuthor])
async def list_public_courses(
    db: AsyncSession = Depends(get_db)
):
    """Get all published courses for public listing"""
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.lessons), selectinload(Course.author))
        .where(Course.is_published == True)
        .order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()
    
    # Add lessons_count to each course
    for course in courses:
        course.lessons_count = len([l for l in course.lessons if l.is_published])
    
    return courses


@router.get("/slug/{course_slug}", response_model=CourseWithLessons)
async def get_course_by_slug(
    course_slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get course by slug with lessons list (public endpoint)"""
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.author), selectinload(Course.lessons))
        .where(Course.slug == course_slug)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user can view unpublished course (only author or admin)
    is_owner = current_user and (course.author_id == current_user.id or current_user.role == UserRole.ADMIN)
    
    if not course.is_published and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Filter lessons based on publish status
    if is_owner:
        lessons = sorted(course.lessons, key=lambda l: l.order)
    else:
        lessons = sorted([l for l in course.lessons if l.is_published], key=lambda l: l.order)
    
    return CourseWithLessons(
        id=course.id,
        author_id=course.author_id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        icon=course.icon,
        cover_image=course.cover_image,
        is_published=course.is_published,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lessons_count=len(lessons),
        author=course.author,
        lessons=[
            LessonSidebarItem(
                id=l.id,
                title=l.title,
                slug=l.slug,
                order=l.order,
                is_published=l.is_published
            )
            for l in lessons
        ]
    )


@router.get("/slug/{course_slug}/lesson/{lesson_slug}", response_model=LessonWithContent)
async def get_lesson_content(
    course_slug: str,
    lesson_slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific lesson content within a course"""
    # Get course first
    course_result = await db.execute(
        select(Course).where(Course.slug == course_slug)
    )
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check course access
    is_owner = current_user and (course.author_id == current_user.id or current_user.role == UserRole.ADMIN)
    if not course.is_published and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get lesson
    lesson_result = await db.execute(
        select(Lesson).where(
            Lesson.course_id == course.id,
            Lesson.slug == lesson_slug
        )
    )
    lesson = lesson_result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check lesson access
    if not lesson.is_published and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    return lesson


@router.get("/slug/{course_slug}/first", response_model=LessonWithContent)
async def get_first_lesson(
    course_slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get first lesson in a course (redirects to first lesson when visiting course URL)"""
    # Get course
    course_result = await db.execute(
        select(Course).where(Course.slug == course_slug)
    )
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    is_owner = current_user and (course.author_id == current_user.id or current_user.role == UserRole.ADMIN)
    if not course.is_published and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get first lesson
    if is_owner:
        lesson_query = select(Lesson).where(Lesson.course_id == course.id).order_by(Lesson.order).limit(1)
    else:
        lesson_query = select(Lesson).where(
            Lesson.course_id == course.id,
            Lesson.is_published == True
        ).order_by(Lesson.order).limit(1)
    
    lesson_result = await db.execute(lesson_query)
    lesson = lesson_result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No lessons found in this course"
        )
    
    return lesson


# ============== Writer Course Management Routes ==============

@router.get("/my", response_model=List[CourseResponse])
async def list_my_courses(
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses created by current user"""
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.lessons))
        .where(Course.author_id == current_user.id)
        .order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()
    
    return [
        CourseResponse(
            id=course.id,
            author_id=course.author_id,
            title=course.title,
            slug=course.slug,
            description=course.description,
            icon=course.icon,
            cover_image=course.cover_image,
            is_published=course.is_published,
            created_at=course.created_at,
            updated_at=course.updated_at,
            lessons_count=len(course.lessons)
        )
        for course in courses
    ]


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Create a new course"""
    base_slug = slugify(course_data.title)
    
    # Check for existing slugs
    result = await db.execute(
        select(Course.slug).where(Course.slug.like(f"{base_slug}%"))
    )
    existing_slugs = [r[0] for r in result.fetchall()]
    
    slug = generate_unique_slug(base_slug, existing_slugs)
    
    course = Course(
        author_id=current_user.id,
        title=course_data.title,
        slug=slug,
        description=course_data.description,
        icon=course_data.icon,
        cover_image=course_data.cover_image,
        is_published=course_data.is_published
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(
        id=course.id,
        author_id=course.author_id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        icon=course.icon,
        cover_image=course.cover_image,
        is_published=course.is_published,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lessons_count=0
    )


@router.get("/{course_id}", response_model=CourseWithLessons)
async def get_course_by_id(
    course_id: UUID,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Get a course by ID (for editing)"""
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.author), selectinload(Course.lessons))
        .where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check ownership
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this course"
        )
    
    return CourseWithLessons(
        id=course.id,
        author_id=course.author_id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        icon=course.icon,
        cover_image=course.cover_image,
        is_published=course.is_published,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lessons_count=len(course.lessons),
        author=course.author,
        lessons=sorted([
            LessonSidebarItem(
                id=l.id,
                title=l.title,
                slug=l.slug,
                order=l.order,
                is_published=l.is_published
            )
            for l in course.lessons
        ], key=lambda l: l.order)
    )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Update a course"""
    result = await db.execute(
        select(Course).options(selectinload(Course.lessons)).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this course"
        )
    
    # Update fields
    if course_data.title is not None:
        course.title = course_data.title
        course.slug = slugify(course_data.title)
    if course_data.description is not None:
        course.description = course_data.description
    if course_data.icon is not None:
        course.icon = course_data.icon
    if course_data.cover_image is not None:
        course.cover_image = course_data.cover_image
    if course_data.is_published is not None:
        course.is_published = course_data.is_published
    
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(
        id=course.id,
        author_id=course.author_id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        icon=course.icon,
        cover_image=course.cover_image,
        is_published=course.is_published,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lessons_count=len(course.lessons)
    )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course and all its lessons"""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this course"
        )
    
    await db.delete(course)
    await db.commit()


# ============== Lesson Management Routes ==============

@router.get("/{course_id}/lessons", response_model=List[LessonResponse])
async def list_course_lessons(
    course_id: UUID,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Get all lessons in a course (for management)"""
    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    result = await db.execute(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)
    )
    return list(result.scalars().all())


@router.post("/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: LessonCreate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Create a new lesson in a course"""
    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == lesson_data.course_id))
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Generate slug
    base_slug = slugify(lesson_data.title)
    result = await db.execute(
        select(Lesson.slug).where(
            Lesson.course_id == course.id,
            Lesson.slug.like(f"{base_slug}%")
        )
    )
    existing_slugs = [r[0] for r in result.fetchall()]
    slug = generate_unique_slug(base_slug, existing_slugs)
    
    # Get next order number
    max_order_result = await db.execute(
        select(func.max(Lesson.order)).where(Lesson.course_id == course.id)
    )
    max_order = max_order_result.scalar() or 0
    
    lesson = Lesson(
        course_id=course.id,
        title=lesson_data.title,
        slug=slug,
        content=lesson_data.content,
        excerpt=lesson_data.excerpt,
        order=max_order + 1,
        is_published=lesson_data.is_published,
        reading_time=calculate_reading_time(lesson_data.content)
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    
    return lesson


@router.get("/lessons/{lesson_id}", response_model=LessonWithContent)
async def get_lesson_by_id(
    lesson_id: UUID,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Get a lesson by ID (for editing)"""
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.course)).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    
    if lesson.course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: UUID,
    lesson_data: LessonUpdate,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Update a lesson"""
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.course)).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    
    if lesson.course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    if lesson_data.title is not None:
        lesson.title = lesson_data.title
        lesson.slug = slugify(lesson_data.title)
    if lesson_data.content is not None:
        lesson.content = lesson_data.content
        lesson.reading_time = calculate_reading_time(lesson_data.content)
    if lesson_data.excerpt is not None:
        lesson.excerpt = lesson_data.excerpt
    if lesson_data.is_published is not None:
        lesson.is_published = lesson_data.is_published
    
    await db.commit()
    await db.refresh(lesson)
    
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Delete a lesson"""
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.course)).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    
    if lesson.course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await db.delete(lesson)
    await db.commit()


@router.post("/lessons/{lesson_id}/reorder", response_model=MessageResponse)
async def reorder_lesson(
    lesson_id: UUID,
    new_order: int = Query(..., ge=1),
    current_user: User = Depends(get_current_writer),
    db: AsyncSession = Depends(get_db)
):
    """Change lesson order position"""
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.course)).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    
    if lesson.course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    old_order = lesson.order
    
    # Get all lessons in the course
    lessons_result = await db.execute(
        select(Lesson).where(Lesson.course_id == lesson.course_id).order_by(Lesson.order)
    )
    lessons = list(lessons_result.scalars().all())
    
    # Reorder
    if new_order < old_order:
        for l in lessons:
            if l.id == lesson.id:
                l.order = new_order
            elif new_order <= l.order < old_order:
                l.order += 1
    else:
        for l in lessons:
            if l.id == lesson.id:
                l.order = new_order
            elif old_order < l.order <= new_order:
                l.order -= 1
    
    await db.commit()
    
    return MessageResponse(message="Lesson reordered successfully")
