"""add_uppercase_rider_type

Revision ID: 1e5ee02bc907
Revises: e8b18c5c2c74
Create Date: 2025-11-04 22:17:20.396596

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1e5ee02bc907'
down_revision = 'e8b18c5c2c74'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'RIDER' (uppercase) to match existing enum pattern
    op.execute("ALTER TYPE usertype ADD VALUE IF NOT EXISTS 'RIDER'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values easily
    pass
