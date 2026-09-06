"""empty message

Revision ID: b4a68a101f56
Revises: f904b61908a8
Create Date: 2026-04-02 22:16:21.118512

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4a68a101f56'
down_revision: Union[str, Sequence[str], None] = 'f904b61908a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE journals
        ADD COLUMN IF NOT EXISTS trigger_category VARCHAR
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE journals
        DROP COLUMN IF EXISTS trigger_category
    """)
