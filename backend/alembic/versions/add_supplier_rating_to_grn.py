"""add supplier rating to grn

Revision ID: add_supplier_rating_grn
Revises: add_received_status
Create Date: 2025-11-04 13:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_supplier_rating_grn'
down_revision = 'add_received_status'
branch_labels = None
depends_on = None


def upgrade():
    # Add supplier rating fields to goods_received_notes table
    op.add_column('goods_received_notes', sa.Column('supplier_rating', sa.Numeric(precision=2, scale=1), nullable=True))
    op.add_column('goods_received_notes', sa.Column('supplier_feedback', sa.Text(), nullable=True))
    op.add_column('goods_received_notes', sa.Column('rated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('goods_received_notes', sa.Column('rated_by', sa.String(), nullable=True))
    
    # Add foreign key for rated_by
    op.create_foreign_key(
        'fk_grn_rated_by_user',
        'goods_received_notes',
        'users',
        ['rated_by'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    # Remove foreign key
    op.drop_constraint('fk_grn_rated_by_user', 'goods_received_notes', type_='foreignkey')
    
    # Remove columns
    op.drop_column('goods_received_notes', 'rated_by')
    op.drop_column('goods_received_notes', 'rated_at')
    op.drop_column('goods_received_notes', 'supplier_feedback')
    op.drop_column('goods_received_notes', 'supplier_rating')
