"""add_password_reset_fields

Revision ID: 59cce9fa0876
Revises: 521a7f6c8598
Create Date: 2025-11-07 23:51:39.930110

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '59cce9fa0876'
down_revision = '521a7f6c8598'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add password reset fields to users table
    op.add_column('users', sa.Column('password_reset_token', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove password reset fields from users table
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
