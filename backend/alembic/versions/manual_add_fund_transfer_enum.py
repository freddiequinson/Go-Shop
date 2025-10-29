"""Add FUND_TRANSFER to PaymentMethod enum

Revision ID: manual_fund_transfer
Revises: 6f4d7810ac42
Create Date: 2025-09-22 04:34:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'manual_fund_transfer'
down_revision = '6f4d7810ac42'
branch_labels = None
depends_on = None


def upgrade():
    # Add the new enum value to the existing enum
    op.execute("ALTER TYPE paymentmethod ADD VALUE 'fund_transfer'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the enum and updating all references
    pass
