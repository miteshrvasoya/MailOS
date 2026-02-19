"""add_classification_status_to_email

Revision ID: a1b2c3d4e5f7
Revises: ca6522051b5e
Create Date: 2026-02-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = 'ca6522051b5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('emailinsight', sa.Column('classification_status', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='pending'))


def downgrade() -> None:
    op.drop_column('emailinsight', 'classification_status')
