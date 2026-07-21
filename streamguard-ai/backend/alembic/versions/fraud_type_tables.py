"""fraud type tables

Revision ID: fraud_type_tables
Revises: 50cebf04055e
Create Date: 2026-07-19 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fraud_type_tables'
down_revision: Union[str, None] = '50cebf04055e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Add columns to transactions table
    op.add_column('transactions', sa.Column('device_fingerprint_hash', sa.String(length=64), nullable=True))
    op.add_column('transactions', sa.Column('device_first_seen', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('transactions', sa.Column('customer_avg_amount_30d', sa.Numeric(precision=15, scale=2), nullable=True))
    op.add_column('transactions', sa.Column('amount_vs_avg_ratio', sa.Numeric(precision=8, scale=4), nullable=True))
    op.add_column('transactions', sa.Column('ip_geolocation_country', sa.String(length=2), nullable=True))
    op.add_column('transactions', sa.Column('card_issuing_country', sa.String(length=2), nullable=True))
    op.add_column('transactions', sa.Column('geo_mismatch', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('transactions', sa.Column('account_inactive_days', sa.Integer(), server_default='0', nullable=True))
    op.add_column('transactions', sa.Column('fraud_type_detected', sa.String(length=50), nullable=True))

    # 2. Create customer_device_history table
    op.create_table(
        'customer_device_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', sa.String(length=255), nullable=False),
        sa.Column('device_fingerprint_hash', sa.String(length=64), nullable=False),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('transaction_count', sa.Integer(), server_default='1', nullable=False),
        sa.Column('is_flagged', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_customer_device', 'customer_device_history', ['org_id', 'customer_id', 'device_fingerprint_hash'], unique=True)

    # 3. Create customer_dispute_history table
    op.create_table(
        'customer_dispute_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', sa.String(length=255), nullable=True),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('customer_phone', sa.String(length=20), nullable=True),
        sa.Column('dispute_count', sa.Integer(), server_default='1', nullable=False),
        sa.Column('dispute_won_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('dispute_lost_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_disputed_amount', sa.Numeric(precision=15, scale=2), server_default='0', nullable=False),
        sa.Column('last_dispute_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dispute_rate', sa.Numeric(precision=5, scale=4), server_default='0', nullable=False),
        sa.Column('is_flagged_chargeback_risk', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_dispute_history_customer', 'customer_dispute_history', ['customer_id', 'customer_email'])

    # 4. Create customer_sessions table
    op.create_table(
        'customer_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', sa.String(length=255), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('ip_address', postgresql.INET(), nullable=False),
        sa.Column('ip_country', sa.String(length=2), nullable=True),
        sa.Column('ip_city', sa.String(length=100), nullable=True),
        sa.Column('device_fingerprint_hash', sa.String(length=64), nullable=True),
        sa.Column('user_agent_hash', sa.String(length=64), nullable=True),
        sa.Column('login_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_suspicious', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_sessions_customer', 'customer_sessions', ['org_id', 'customer_id', 'login_at'])

    # 5. Create account_events table
    op.create_table(
        'account_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('ip_country', sa.String(length=2), nullable=True),
        sa.Column('device_fingerprint_hash', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_account_events_customer', 'account_events', ['org_id', 'customer_id', 'created_at'])

    # 6. Create customer_refund_history table
    op.create_table(
        'customer_refund_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', sa.String(length=255), nullable=False),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('device_fingerprint_hash', sa.String(length=64), nullable=True),
        sa.Column('total_orders', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_refunds', sa.Integer(), server_default='0', nullable=False),
        sa.Column('refund_rate', sa.Numeric(precision=5, scale=4), server_default='0', nullable=False),
        sa.Column('total_refund_amount', sa.Numeric(precision=15, scale=2), server_default='0', nullable=False),
        sa.Column('last_refund_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_flagged', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. Create promo_abuse_signals table
    op.create_table(
        'promo_abuse_signals',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('signal_type', sa.String(length=30), nullable=False),
        sa.Column('signal_hash', sa.String(length=64), nullable=False),
        sa.Column('account_count', sa.Integer(), server_default='1', nullable=False),
        sa.Column('order_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('promo_use_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_flagged', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_promo_signal', 'promo_abuse_signals', ['org_id', 'signal_type', 'signal_hash'], unique=True)


def downgrade() -> None:
    op.drop_index('idx_promo_signal', table_name='promo_abuse_signals')
    op.drop_table('promo_abuse_signals')
    op.drop_table('customer_refund_history')
    op.drop_index('idx_account_events_customer', table_name='account_events')
    op.drop_table('account_events')
    op.drop_index('idx_sessions_customer', table_name='customer_sessions')
    op.drop_table('customer_sessions')
    op.drop_index('idx_dispute_history_customer', table_name='customer_dispute_history')
    op.drop_table('customer_dispute_history')
    op.drop_index('idx_customer_device', table_name='customer_device_history')
    op.drop_table('customer_device_history')

    op.drop_column('transactions', 'fraud_type_detected')
    op.drop_column('transactions', 'account_inactive_days')
    op.drop_column('transactions', 'geo_mismatch')
    op.drop_column('transactions', 'card_issuing_country')
    op.drop_column('transactions', 'ip_geolocation_country')
    op.drop_column('transactions', 'amount_vs_avg_ratio')
    op.drop_column('transactions', 'customer_avg_amount_30d')
    op.drop_column('transactions', 'device_first_seen')
    op.drop_column('transactions', 'device_fingerprint_hash')
