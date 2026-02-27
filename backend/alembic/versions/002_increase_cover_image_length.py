"""Increase cover_image column length

Revision ID: 002_cover_image
Revises: 001_initial
Create Date: 2026-02-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_cover_image'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Increase cover_image column length from 500 to 2000
    op.alter_column(
        'posts',
        'cover_image',
        existing_type=sa.String(500),
        type_=sa.String(2000),
        existing_nullable=True
    )


def downgrade() -> None:
    # Revert cover_image column length back to 500
    op.alter_column(
        'posts',
        'cover_image',
        existing_type=sa.String(2000),
        type_=sa.String(500),
        existing_nullable=True
    )
