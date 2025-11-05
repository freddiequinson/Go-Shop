"""add_rider_user_type

Revision ID: e8b18c5c2c74
Revises: add_rider_documents
Create Date: 2025-11-04 22:09:54.122438

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8b18c5c2c74'
down_revision = 'add_rider_documents'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'RIDER' to the usertype enum (uppercase to match existing pattern)
    op.execute("ALTER TYPE usertype ADD VALUE IF NOT EXISTS 'RIDER'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the enum type
    pass
