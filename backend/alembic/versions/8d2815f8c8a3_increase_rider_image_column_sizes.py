"""increase_rider_image_column_sizes

Revision ID: 8d2815f8c8a3
Revises: 1e5ee02bc907
Create Date: 2025-11-04 22:33:38.060130

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8d2815f8c8a3'
down_revision = '1e5ee02bc907'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Change image URL columns from VARCHAR(500) to TEXT to support base64 images
    op.alter_column('riders', 'profile_picture_url',
                    type_=sa.Text(),
                    existing_type=sa.String(500))
    op.alter_column('riders', 'ghana_card_front_url',
                    type_=sa.Text(),
                    existing_type=sa.String(500))
    op.alter_column('riders', 'ghana_card_back_url',
                    type_=sa.Text(),
                    existing_type=sa.String(500))


def downgrade() -> None:
    # Revert back to VARCHAR(500)
    op.alter_column('riders', 'profile_picture_url',
                    type_=sa.String(500),
                    existing_type=sa.Text())
    op.alter_column('riders', 'ghana_card_front_url',
                    type_=sa.String(500),
                    existing_type=sa.Text())
    op.alter_column('riders', 'ghana_card_back_url',
                    type_=sa.String(500),
                    existing_type=sa.Text())
