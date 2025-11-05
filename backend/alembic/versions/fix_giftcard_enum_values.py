"""fix giftcard enum values

Revision ID: fix_giftcard_enums
Revises: 308b958a51e6
Create Date: 2025-11-04 19:10:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_giftcard_enums'
down_revision = '308b958a51e6'
branch_labels = None
depends_on = None


def upgrade():
    # Drop and recreate the enums with correct lowercase values
    
    # First, we need to alter the columns to use varchar temporarily
    op.execute("ALTER TABLE giftcards ALTER COLUMN card_type TYPE varchar(20)")
    op.execute("ALTER TABLE giftcards ALTER COLUMN status TYPE varchar(20)")
    
    # Drop the old enum types
    op.execute("DROP TYPE IF EXISTS giftcardtype")
    op.execute("DROP TYPE IF EXISTS giftcardstatus")
    
    # Create new enum types with lowercase values
    op.execute("CREATE TYPE giftcardtype AS ENUM ('expiry', 'non_expiry')")
    op.execute("CREATE TYPE giftcardstatus AS ENUM ('active', 'redeemed', 'expired', 'cancelled')")
    
    # Update existing data to lowercase (if any exists)
    op.execute("UPDATE giftcards SET card_type = LOWER(card_type)")
    op.execute("UPDATE giftcards SET status = LOWER(status)")
    
    # Convert columns back to enum type
    op.execute("ALTER TABLE giftcards ALTER COLUMN card_type TYPE giftcardtype USING card_type::giftcardtype")
    op.execute("ALTER TABLE giftcards ALTER COLUMN status TYPE giftcardstatus USING status::giftcardstatus")


def downgrade():
    # Reverse the process
    op.execute("ALTER TABLE giftcards ALTER COLUMN card_type TYPE varchar(20)")
    op.execute("ALTER TABLE giftcards ALTER COLUMN status TYPE varchar(20)")
    
    op.execute("DROP TYPE IF EXISTS giftcardtype")
    op.execute("DROP TYPE IF EXISTS giftcardstatus")
    
    # Recreate with uppercase values
    op.execute("CREATE TYPE giftcardtype AS ENUM ('EXPIRY', 'NON_EXPIRY')")
    op.execute("CREATE TYPE giftcardstatus AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED')")
    
    # Update data back to uppercase
    op.execute("UPDATE giftcards SET card_type = UPPER(card_type)")
    op.execute("UPDATE giftcards SET status = UPPER(status)")
    
    # Convert columns back to enum type
    op.execute("ALTER TABLE giftcards ALTER COLUMN card_type TYPE giftcardtype USING card_type::giftcardtype")
    op.execute("ALTER TABLE giftcards ALTER COLUMN status TYPE giftcardstatus USING status::giftcardstatus")
