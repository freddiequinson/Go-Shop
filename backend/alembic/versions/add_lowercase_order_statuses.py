"""add lowercase order statuses

Revision ID: add_lowercase_order_statuses
Revises: add_wallet_enum
Create Date: 2025-11-04 20:16:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_lowercase_order_statuses'
down_revision = 'add_wallet_enum'
branch_labels = None
depends_on = None


def upgrade():
    # Add lowercase values to OrderStatus enum
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'pending_payment'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'payment_failed'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'pending'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'confirmed'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'preparing'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'dispatched'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'delivered'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'cancelled'")


def downgrade():
    # Cannot remove enum values in PostgreSQL easily
    pass
