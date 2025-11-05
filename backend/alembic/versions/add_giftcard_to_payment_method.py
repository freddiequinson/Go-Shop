"""add giftcard to payment method enum

Revision ID: add_giftcard_payment
Revises: increase_code_length
Create Date: 2025-11-04 19:30:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_giftcard_payment'
down_revision = 'increase_code_length'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'giftcard' to PaymentMethod enum if it doesn't exist
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'giftcard'")


def downgrade():
    # Cannot remove enum values in PostgreSQL easily
    # Would require recreating the enum type
    pass
