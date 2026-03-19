"""fix user label prefix columns

The production database may be missing newer columns on the `user` table
(e.g. `apply_prefix_to_existing`). This migration adds them using
Postgres `IF NOT EXISTS` so upgrades are safe and idempotent.
"""

from typing import Optional, Sequence, Union

from alembic import op


revision: str = "b0c1d2e3f4g5"
down_revision: Union[str, None] = "c4d5e6f7g8h9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use IF NOT EXISTS so this is safe even if the column was partially added
    # by earlier migrations (those migrations swallow errors).
    op.execute(
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS label_prefix VARCHAR NOT NULL DEFAULT \'MailOS\''
    )
    op.execute(
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS apply_prefix_to_existing BOOLEAN NOT NULL DEFAULT false'
    )
    op.execute(
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS auto_create_events BOOLEAN NOT NULL DEFAULT false'
    )


def downgrade() -> None:
    # Intentionally conservative: removing columns can break running production data.
    # Keep downgrade as no-op.
    pass

