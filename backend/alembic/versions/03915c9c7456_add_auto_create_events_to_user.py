"""add auto_create_events to user

Revision ID: 03915c9c7456
Revises: 2ecbe4090d10
Create Date: 2026-02-24 19:24:45.128394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '03915c9c7456'
down_revision: Union[str, None] = '2ecbe4090d10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user', sa.Column('auto_create_events', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    op.drop_column('user', 'auto_create_events')
