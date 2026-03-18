"""Add auto-clean rules system

Revision ID: a2b3c4d5e6f7
Revises: f6c93cd09ad2
Create Date: 2026-03-17 23:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = 'f6c93cd09ad2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    # Create the autocleanrule table if it doesn't exist
    if 'autocleanrule' not in existing_tables:
        op.create_table(
            'autocleanrule',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('rule_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('conditions', sa.JSON(), nullable=True),
            sa.Column('action', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('retention_hours', sa.Integer(), nullable=False),
            sa.Column('is_enabled', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_autocleanrule_id'), 'autocleanrule', ['id'], unique=False)
        op.create_index(op.f('ix_autocleanrule_user_id'), 'autocleanrule', ['user_id'], unique=False)

    # Add auto-clean columns to emailinsight
    existing_columns = [c['name'] for c in inspector.get_columns('emailinsight')]

    if 'auto_clean_rule_id' not in existing_columns:
        op.add_column('emailinsight',
            sa.Column('auto_clean_rule_id', sa.Uuid(), nullable=True)
        )
        op.create_foreign_key(
            'fk_emailinsight_auto_clean_rule_id',
            'emailinsight', 'autocleanrule',
            ['auto_clean_rule_id'], ['id']
        )
        op.create_index(
            op.f('ix_emailinsight_auto_clean_rule_id'),
            'emailinsight', ['auto_clean_rule_id'], unique=False
        )

    if 'scheduled_clean_at' not in existing_columns:
        op.add_column('emailinsight',
            sa.Column('scheduled_clean_at', sa.DateTime(), nullable=True)
        )

    if 'clean_action_status' not in existing_columns:
        op.add_column('emailinsight',
            sa.Column('clean_action_status', sqlmodel.sql.sqltypes.AutoString(),
                       nullable=False, server_default='none')
        )


def downgrade() -> None:
    # Drop emailinsight columns
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_columns = [c['name'] for c in inspector.get_columns('emailinsight')]

    if 'clean_action_status' in existing_columns:
        op.drop_column('emailinsight', 'clean_action_status')
    if 'scheduled_clean_at' in existing_columns:
        op.drop_column('emailinsight', 'scheduled_clean_at')
    if 'auto_clean_rule_id' in existing_columns:
        op.drop_index(op.f('ix_emailinsight_auto_clean_rule_id'), table_name='emailinsight')
        op.drop_constraint('fk_emailinsight_auto_clean_rule_id', 'emailinsight', type_='foreignkey')
        op.drop_column('emailinsight', 'auto_clean_rule_id')

    # Drop autocleanrule table
    existing_tables = inspector.get_table_names()
    if 'autocleanrule' in existing_tables:
        op.drop_index(op.f('ix_autocleanrule_user_id'), table_name='autocleanrule')
        op.drop_index(op.f('ix_autocleanrule_id'), table_name='autocleanrule')
        op.drop_table('autocleanrule')
