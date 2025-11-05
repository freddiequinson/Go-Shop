"""add supplier to usertype enum

Revision ID: add_supplier_usertype
Revises: 
Create Date: 2025-11-02 10:33:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_supplier_usertype'
down_revision = 'supplier_portal_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'supplier' to the usertype enum
    op.execute("ALTER TYPE usertype ADD VALUE IF NOT EXISTS 'supplier'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the enum type
    pass
