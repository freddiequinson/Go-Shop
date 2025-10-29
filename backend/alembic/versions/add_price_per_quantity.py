"""add price_per_quantity to products

Revision ID: add_price_per_quantity
Revises: 
Create Date: 2025-10-29 07:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_price_per_quantity_v2'
down_revision = 'ed6464eebcd0'  # Latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add price_per_quantity column to products table
    op.add_column('products', sa.Column('price_per_quantity', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    # Remove price_per_quantity column from products table
    op.drop_column('products', 'price_per_quantity')
