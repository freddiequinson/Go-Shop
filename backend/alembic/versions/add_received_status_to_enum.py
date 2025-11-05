"""add received status to supply offer enum

Revision ID: add_received_status
Revises: 
Create Date: 2025-11-04 12:54:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_received_status'
down_revision = 'direct_order_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'received' to the supplyofferstatus enum
    op.execute("ALTER TYPE supplyofferstatus ADD VALUE IF NOT EXISTS 'received'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values easily
    # You would need to recreate the enum type to remove a value
    pass
