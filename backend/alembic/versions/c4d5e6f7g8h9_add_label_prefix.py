"""Add label_prefix to user table

Revision ID: c4d5e6f7g8h9
Revises: a2b3c4d5e6f7
Create Date: 2026-03-18

"""
from alembic import op
import sqlalchemy as sa

revision = 'c4d5e6f7g8h9'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add label_prefix column to user table with default 'MailOS'
    try:
        op.add_column('user', sa.Column('label_prefix', sa.String(), server_default='MailOS', nullable=False))
    except Exception:
        pass  # Column may already exist


def downgrade() -> None:
    try:
        op.drop_column('user', 'label_prefix')
    except Exception:
        pass
