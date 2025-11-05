"""add rider documents

Revision ID: add_rider_documents
Revises: add_lowercase_order_statuses
Create Date: 2025-11-04 20:46:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_rider_documents'
down_revision = 'add_lowercase_order_statuses'
branch_labels = None
depends_on = None


def upgrade():
    # Add profile picture and Ghana card fields to riders table
    op.add_column('riders', sa.Column('profile_picture_url', sa.String(500), nullable=True))
    op.add_column('riders', sa.Column('ghana_card_number', sa.String(50), nullable=True))
    op.add_column('riders', sa.Column('ghana_card_front_url', sa.String(500), nullable=True))
    op.add_column('riders', sa.Column('ghana_card_back_url', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('riders', 'ghana_card_back_url')
    op.drop_column('riders', 'ghana_card_front_url')
    op.drop_column('riders', 'ghana_card_number')
    op.drop_column('riders', 'profile_picture_url')
