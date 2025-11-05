"""increase giftcard code length

Revision ID: increase_code_length
Revises: fix_giftcard_enums
Create Date: 2025-11-04 19:20:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'increase_code_length'
down_revision = 'fix_giftcard_enums'
branch_labels = None
depends_on = None


def upgrade():
    # Increase code column length from 16 to 24 to accommodate format GOSH-XXXX-XXXX-XXXX (19 chars)
    op.alter_column('giftcards', 'code',
                    existing_type=sa.String(16),
                    type_=sa.String(24),
                    existing_nullable=False)


def downgrade():
    # Revert back to 16
    op.alter_column('giftcards', 'code',
                    existing_type=sa.String(24),
                    type_=sa.String(16),
                    existing_nullable=False)
