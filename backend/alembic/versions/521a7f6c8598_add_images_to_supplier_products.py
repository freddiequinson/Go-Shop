"""add_images_to_supplier_products

Revision ID: 521a7f6c8598
Revises: 714ce4b6b990
Create Date: 2025-11-05 18:14:31.078952

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '521a7f6c8598'
down_revision = '714ce4b6b990'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add images column to supplier_products table
    op.add_column('supplier_products', 
        sa.Column('images', postgresql.JSONB, nullable=True, server_default='[]')
    )


def downgrade() -> None:
    # Remove images column from supplier_products table
    op.drop_column('supplier_products', 'images')
