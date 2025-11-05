"""add user addresses table

Revision ID: add_user_addresses
Revises: create_audit_logs
Create Date: 2025-01-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_addresses'
down_revision = 'create_audit_logs'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_addresses table
    op.create_table(
        'user_addresses',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('label', sa.String(100), nullable=False),
        sa.Column('street', sa.String(255), nullable=False),
        sa.Column('area', sa.String(100), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('latitude', sa.String(50), nullable=True),
        sa.Column('longitude', sa.String(50), nullable=True),
        sa.Column('additional_info', sa.Text(), nullable=True),
        sa.Column('is_default', sa.Boolean(), default=False, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create indexes
    op.create_index('idx_user_addresses_user_id', 'user_addresses', ['user_id'])
    op.create_index('idx_user_addresses_is_default', 'user_addresses', ['user_id', 'is_default'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_user_addresses_is_default')
    op.drop_index('idx_user_addresses_user_id')
    
    # Drop table
    op.drop_table('user_addresses')
