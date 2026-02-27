"""
Initial migration - Create all tables (MySQL)

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('reader', 'writer', 'admin', name='userrole'), default='reader'),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create profiles table
    op.create_table(
        'profiles',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('website', sa.String(255), nullable=True),
        sa.Column('location', sa.String(100), nullable=True),
        sa.Column('twitter_handle', sa.String(50), nullable=True),
        sa.Column('github_handle', sa.String(50), nullable=True),
        sa.Column('linkedin_url', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('slug', sa.String(60), unique=True, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('slug', sa.String(120), unique=True, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('parent_id', sa.CHAR(36), sa.ForeignKey('categories.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    
    # Create posts table
    op.create_table(
        'posts',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('author_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(300), unique=True, nullable=False, index=True),
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('cover_image', sa.String(500), nullable=True),
        sa.Column('status', sa.Enum('draft', 'published', 'archived', name='poststatus'), default='draft'),
        sa.Column('reading_time', sa.Integer(), default=0),
        sa.Column('word_count', sa.Integer(), default=0),
        sa.Column('views', sa.Integer(), default=0),
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create post_tags association table
    op.create_table(
        'post_tags',
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('posts.id', ondelete='CASCADE')),
        sa.Column('tag_id', sa.CHAR(36), sa.ForeignKey('tags.id', ondelete='CASCADE')),
    )
    
    # Create post_categories association table
    op.create_table(
        'post_categories',
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('posts.id', ondelete='CASCADE')),
        sa.Column('category_id', sa.CHAR(36), sa.ForeignKey('categories.id', ondelete='CASCADE')),
    )
    
    # Create drafts table
    op.create_table(
        'drafts',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('author_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('version', sa.Integer(), default=1),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    
    # Create comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), index=True),
        sa.Column('author_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('parent_id', sa.CHAR(36), sa.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_edited', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create likes table
    op.create_table(
        'likes',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), index=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    op.create_index('idx_likes_user_post', 'likes', ['user_id', 'post_id'], unique=True)
    
    # Create bookmarks table
    op.create_table(
        'bookmarks',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), index=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    op.create_index('idx_bookmarks_user_post', 'bookmarks', ['user_id', 'post_id'], unique=True)
    
    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('token', sa.String(500), unique=True, nullable=False, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    
    # Create ai_logs table
    op.create_table(
        'ai_logs',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('output_text', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )
    
    # Create indexes for posts
    op.create_index('idx_posts_status_published', 'posts', ['status', 'published_at'])
    op.create_index('idx_posts_author_status', 'posts', ['author_id', 'status'])


def downgrade() -> None:
    op.drop_table('ai_logs')
    op.drop_table('refresh_tokens')
    op.drop_table('bookmarks')
    op.drop_table('likes')
    op.drop_table('comments')
    op.drop_table('drafts')
    op.drop_table('post_categories')
    op.drop_table('post_tags')
    op.drop_table('posts')
    op.drop_table('categories')
    op.drop_table('tags')
    op.drop_table('profiles')
    op.drop_table('users')
