"""add giftcards

Revision ID: add_giftcards
Revises: add_profile_picture
Create Date: 2024-10-28

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_giftcards'
down_revision = 'add_profile_picture'
branch_labels = None
depends_on = None


def upgrade():
    # Create giftcards table
    op.create_table('giftcards',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=16), nullable=False),
        sa.Column('pin', sa.String(length=6), nullable=False),
        sa.Column('amount_cedis', sa.Integer(), nullable=False),
        sa.Column('original_amount_cedis', sa.Integer(), nullable=False),
        sa.Column('card_type', sa.Enum('EXPIRY', 'NON_EXPIRY', name='giftcardtype'), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED', name='giftcardstatus'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('generated_by_id', sa.String(length=36), nullable=False),
        sa.Column('redeemed_by_id', sa.String(length=36), nullable=True),
        sa.Column('redeemed_at', sa.DateTime(), nullable=True),
        sa.Column('hash_chain', sa.Text(), nullable=False),
        sa.Column('previous_hash', sa.Text(), nullable=True),
        sa.Column('nonce', sa.String(length=64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['generated_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['redeemed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_giftcards_code'), 'giftcards', ['code'], unique=True)
    op.create_index(op.f('ix_giftcards_id'), 'giftcards', ['id'], unique=False)
    
    # Create giftcard_transactions table
    op.create_table('giftcard_transactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('giftcard_id', sa.String(length=36), nullable=False),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('amount_cedis', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('transaction_hash', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['giftcard_id'], ['giftcards.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_giftcard_transactions_id'), 'giftcard_transactions', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_giftcard_transactions_id'), table_name='giftcard_transactions')
    op.drop_table('giftcard_transactions')
    op.drop_index(op.f('ix_giftcards_id'), table_name='giftcards')
    op.drop_index(op.f('ix_giftcards_code'), table_name='giftcards')
    op.drop_table('giftcards')
    op.execute('DROP TYPE giftcardtype')
    op.execute('DROP TYPE giftcardstatus')
