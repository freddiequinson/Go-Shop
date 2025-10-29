"""add geolocation and referral source to users

Revision ID: add_geolocation_referral
Revises: 
Create Date: 2025-01-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_geolocation_referral'
down_revision = 'add_price_per_quantity_v2'  # Latest migration

def upgrade():
    # Add latitude, longitude, and referral_source columns to users table
    op.add_column('users', sa.Column('latitude', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('longitude', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('referral_source', sa.String(length=100), nullable=True))


def downgrade():
    # Remove the columns if rolling back
    op.drop_column('users', 'referral_source')
    op.drop_column('users', 'longitude')
    op.drop_column('users', 'latitude')
