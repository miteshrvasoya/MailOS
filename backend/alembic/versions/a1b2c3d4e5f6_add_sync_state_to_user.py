"""add sync state to user

Revision ID: a1b2c3d4e5f6
Revises: 2dff9cf57437
Create Date: 2026-02-12 08:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6036fa902ef5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user', sa.Column('last_history_id', sa.String(), nullable=True))
    op.add_column('user', sa.Column('last_sync_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'last_sync_at')
    op.drop_column('user', 'last_history_id')
