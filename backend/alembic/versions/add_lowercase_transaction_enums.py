"""add lowercase transaction enum values

Revision ID: add_lowercase_trans_enums
Revises: add_giftcard_payment
Create Date: 2025-11-04 19:50:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_lowercase_trans_enums'
down_revision = 'add_giftcard_payment'
branch_labels = None
depends_on = None


def upgrade():
    # Add lowercase values to TransactionType enum
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'credit'")
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'debit'")
    
    # Add lowercase values to TransactionStatus enum
    op.execute("ALTER TYPE transactionstatus ADD VALUE IF NOT EXISTS 'pending'")
    op.execute("ALTER TYPE transactionstatus ADD VALUE IF NOT EXISTS 'success'")
    op.execute("ALTER TYPE transactionstatus ADD VALUE IF NOT EXISTS 'failed'")
    op.execute("ALTER TYPE transactionstatus ADD VALUE IF NOT EXISTS 'cancelled'")
    
    # Add lowercase values to PaymentMethod enum
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'card'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'mobile_money'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'bank_transfer'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'wallet'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'fund_transfer'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'giftcard'")


def downgrade():
    # Cannot remove enum values in PostgreSQL easily
    # Would require recreating the enum type
    pass
