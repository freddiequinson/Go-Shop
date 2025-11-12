"""add feedback table

Revision ID: add_feedback_001
Revises: c1d2e3f4g5h6
Create Date: 2025-11-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_feedback_001'
down_revision = 'c1d2e3f4g5h6'  # Points to existing head
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'feedback',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('user_email', sa.String(), nullable=True),
        sa.Column('user_name', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=True, server_default='general'),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('page_url', sa.String(), nullable=True),
        sa.Column('survey_responses', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, server_default='new'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_feedback_id'), 'feedback', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_feedback_id'), table_name='feedback')
    op.drop_table('feedback')
    op.execute('DROP TYPE feedbacktype')
    op.execute('DROP TYPE feedbackstatus')
