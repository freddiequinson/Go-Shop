"""add profile picture to users

Revision ID: add_profile_picture
Revises: e2e374def899
Create Date: 2025-01-28

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_profile_picture'
down_revision = 'e2e374def899'  # Points to the latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add profile_picture_url column to users table
    op.add_column('users', sa.Column('profile_picture_url', sa.Text(), nullable=True))


def downgrade():
    # Remove profile_picture_url column from users table
    op.drop_column('users', 'profile_picture_url')
