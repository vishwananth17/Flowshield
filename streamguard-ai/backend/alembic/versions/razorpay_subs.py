"""razorpay billing

Revision ID: razorpay_subs
Revises: 8b9073b465dc
Create Date: 2026-04-17 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'razorpay_subs'
down_revision: Union[str, None] = '8b9073b465dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Update plan column: change length and default
    op.alter_column('organizations', 'plan',
               existing_type=sa.String(length=50),
               type_=sa.String(length=20),
               server_default='free')
    
    # Add new billing fields
    op.add_column('organizations', sa.Column('plan_interval', sa.String(length=10), nullable=True))
    op.add_column('organizations', sa.Column('razorpay_customer_id', sa.String(length=255), nullable=True))
    op.add_column('organizations', sa.Column('razorpay_subscription_id', sa.String(length=255), nullable=True))
    op.add_column('organizations', sa.Column('subscription_status', sa.String(length=20), server_default='active', nullable=False))
    op.add_column('organizations', sa.Column('subscription_start', sa.DateTime(timezone=True), nullable=True))
    op.add_column('organizations', sa.Column('subscription_end', sa.DateTime(timezone=True), nullable=True))
    op.add_column('organizations', sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column('organizations', 'trial_ends_at')
    op.drop_column('organizations', 'subscription_end')
    op.drop_column('organizations', 'subscription_start')
    op.drop_column('organizations', 'subscription_status')
    op.drop_column('organizations', 'razorpay_subscription_id')
    op.drop_column('organizations', 'razorpay_customer_id')
    op.drop_column('organizations', 'plan_interval')
    op.alter_column('organizations', 'plan',
               existing_type=sa.String(length=20),
               type_=sa.String(length=50),
               server_default='starter')
