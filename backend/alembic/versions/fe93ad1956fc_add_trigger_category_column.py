"""add trigger category column

Revision ID: fe93ad1956fc
Revises: b4a68a101f56
Create Date: 2026-09-06 23:08:31.578636

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe93ad1956fc'
down_revision: Union[str, Sequence[str], None] = 'b4a68a101f56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
