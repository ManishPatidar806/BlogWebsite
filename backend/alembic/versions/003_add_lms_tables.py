"""Add LMS tables (courses and lessons)

Revision ID: 003_lms
Revises: 002_cover_image
Create Date: 2026-03-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '003_lms'
down_revision = '002_cover_image'
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Check if a table exists in the database"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    # Create courses table if it doesn't exist
    if not table_exists('courses'):
        op.create_table(
            'courses',
            sa.Column('id', sa.CHAR(36), primary_key=True),
            sa.Column('author_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('slug', sa.String(300), nullable=False, unique=True),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('icon', sa.String(50), nullable=True),
            sa.Column('cover_image', sa.String(2000), nullable=True),
            sa.Column('is_published', sa.Boolean, default=False),
            sa.Column('created_at', sa.DateTime, default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index('idx_courses_author', 'courses', ['author_id'])
        op.create_index('idx_courses_slug', 'courses', ['slug'])
    
    # Create lessons table if it doesn't exist
    if not table_exists('lessons'):
        op.create_table(
            'lessons',
            sa.Column('id', sa.CHAR(36), primary_key=True),
            sa.Column('course_id', sa.CHAR(36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('slug', sa.String(300), nullable=False),
            sa.Column('content', sa.Text, nullable=False),
            sa.Column('excerpt', sa.Text, nullable=True),
            sa.Column('order', sa.Integer, default=0),
            sa.Column('is_published', sa.Boolean, default=False),
            sa.Column('reading_time', sa.Integer, default=0),
            sa.Column('created_at', sa.DateTime, default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index('idx_lesson_course_slug', 'lessons', ['course_id', 'slug'], unique=True)
        op.create_index('idx_lesson_course_order', 'lessons', ['course_id', 'order'])


def downgrade() -> None:
    op.drop_table('lessons')
    op.drop_table('courses')
