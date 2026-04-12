"""add billing fields

Revision ID: 20250412_01
Revises: 20250404_01
Create Date: 2026-04-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250412_01"
down_revision: Union[str, None] = "20250404_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adding new fields
    op.add_column("organizations", sa.Column("stripe_customer_id", sa.String(length=255), nullable=True))
    op.add_column("organizations", sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True))
    op.add_column("organizations", sa.Column("billing_period_start", sa.DateTime(timezone=True), nullable=True))
    
    # Renaming existing fields to match user request
    op.alter_column("organizations", "monthly_tx_limit", new_column_name="monthly_request_limit")
    op.alter_column("organizations", "monthly_tx_count", new_column_name="monthly_request_count")
    
    # Updating defaults
    op.execute("ALTER TABLE organizations ALTER COLUMN monthly_request_limit SET DEFAULT 1000")
    # Also update any existing rows to the new starter limit if they are 'starter' plan
    op.execute("UPDATE organizations SET monthly_request_limit = 1000 WHERE plan = 'starter'")


def downgrade() -> None:
    op.execute("UPDATE organizations SET monthly_request_limit = 10000 WHERE plan = 'starter'")
    op.execute("ALTER TABLE organizations ALTER COLUMN monthly_request_limit SET DEFAULT 10000")
    
    op.alter_column("organizations", "monthly_request_count", new_column_name="monthly_tx_count")
    op.alter_column("organizations", "monthly_request_limit", new_column_name="monthly_tx_limit")
    
    op.drop_column("organizations", "billing_period_start")
    op.drop_column("organizations", "stripe_subscription_id")
    op.drop_column("organizations", "stripe_customer_id")
