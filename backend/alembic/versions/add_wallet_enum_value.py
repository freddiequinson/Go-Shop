"""add wallet enum value

Revision ID: add_wallet_enum
Revises: add_lowercase_trans_enums
Create Date: 2025-11-04 20:05:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_wallet_enum'
down_revision = 'add_lowercase_trans_enums'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'wallet' to PaymentMethod enum (the previous migration might not have added it)
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'wallet'")


def downgrade():
    # Cannot remove enum values in PostgreSQL easily
    pass
