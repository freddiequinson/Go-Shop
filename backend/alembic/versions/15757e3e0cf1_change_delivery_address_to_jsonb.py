"""change_delivery_address_to_jsonb

Revision ID: 15757e3e0cf1
Revises: add_order_payment_tracking
Create Date: 2025-10-31 18:22:28.218125

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '15757e3e0cf1'
down_revision = 'add_order_payment_tracking'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change delivery_address column from JSON to JSONB
    op.execute('ALTER TABLE orders ALTER COLUMN delivery_address TYPE JSONB USING delivery_address::jsonb')


def downgrade() -> None:
    # Change back from JSONB to JSON
    op.execute('ALTER TABLE orders ALTER COLUMN delivery_address TYPE JSON USING delivery_address::json')
