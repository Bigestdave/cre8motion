"""add binary data column to artifacts for persistence across redeploys

Revision ID: b7e1a9c40a11
Revises: d6c5902e84d4
Create Date: 2026-07-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e1a9c40a11"
down_revision: Union[str, None] = "d6c5902e84d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("artifacts", sa.Column("data", sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    op.drop_column("artifacts", "data")
