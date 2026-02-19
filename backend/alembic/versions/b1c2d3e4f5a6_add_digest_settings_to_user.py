"""add_digest_settings_to_user

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f7
Create Date: 2026-02-18 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "digest_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "user",
        sa.Column(
            "digest_frequency",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default="daily",
        ),
    )
    op.add_column(
        "user",
        sa.Column(
            "digest_time_local",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=True,
            server_default="09:00",
        ),
    )


def downgrade() -> None:
    op.drop_column("user", "digest_time_local")
    op.drop_column("user", "digest_frequency")
    op.drop_column("user", "digest_enabled")

