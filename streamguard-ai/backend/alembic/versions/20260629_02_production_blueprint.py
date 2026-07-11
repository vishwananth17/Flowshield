"""production blueprint tables and views

Revision ID: production_blueprint
Revises: integration_method
Create Date: 2026-06-29 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'production_blueprint'
down_revision: Union[str, None] = 'integration_method'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Add threshold columns to organizations
    op.add_column('organizations', sa.Column('threshold_review', sa.Numeric(5, 4), server_default='0.4000', nullable=False))
    op.add_column('organizations', sa.Column('threshold_block', sa.Numeric(5, 4), server_default='0.8000', nullable=False))

    # 2. Create risk_rules table
    op.create_table(
        'risk_rules',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('condition_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('action', sa.String(length=20), nullable=False),
        sa.Column('risk_score_override', sa.Numeric(5, 4), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('priority', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('idx_risk_rules_active_priority', 'risk_rules', ['is_active', 'priority'])

    # 3. Create model_registry table
    op.create_table(
        'model_registry',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('training_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('metrics_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('file_path', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='inactive', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version')
    )
    op.create_index('idx_model_registry_status', 'model_registry', ['status'])

    # 4. Create model_drift_log table
    op.create_table(
        'model_drift_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('feature_name', sa.String(length=100), nullable=False),
        sa.Column('psi_score', sa.Numeric(5, 4), nullable=False),
        sa.Column('checked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('alert_sent', sa.Boolean(), server_default='false', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Create model_comparison_log table
    op.create_table(
        'model_comparison_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('production_model_version', sa.String(length=50), nullable=False),
        sa.Column('production_score', sa.Numeric(5, 4), nullable=False),
        sa.Column('candidate_model_version', sa.String(length=50), nullable=False),
        sa.Column('candidate_score', sa.Numeric(5, 4), nullable=False),
        sa.Column('actual_label', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_model_comp_tx_id', 'model_comparison_log', ['transaction_id'])

    # 6. Create Materialized Views for historical features
    op.execute(
        """
        CREATE MATERIALIZED VIEW customer_historical_aggregates AS
        SELECT
            customer_id,
            SUM(amount) FILTER (WHERE decision = 'allow') AS customer_ltv,
            MIN(created_at) AS first_tx_at,
            MAX(created_at) AS last_tx_at,
            AVG(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS avg_tx_size_30d,
            MAX(amount) FILTER (WHERE decision = 'allow' AND created_at >= NOW() - INTERVAL '30 days') AS max_amount_approved_30d,
            COUNT(*) FILTER (WHERE decision = 'allow') AS approved_tx_count_lt,
            COUNT(*) FILTER (WHERE is_confirmed_fraud = TRUE) AS fraud_alerts_lifetime,
            COUNT(*) FILTER (WHERE decision = 'block' AND created_at >= NOW() - INTERVAL '30 days')::float / 
                NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) AS declined_tx_ratio_30d
        FROM transactions
        GROUP BY customer_id;
        """
    )
    op.execute("CREATE UNIQUE INDEX idx_cust_agg_cust_id ON customer_historical_aggregates (customer_id);")

    op.execute(
        """
        CREATE MATERIALIZED VIEW merchant_historical_aggregates AS
        SELECT
            merchant_id,
            MIN(created_at) AS merchant_first_seen_at,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS merchant_tx_volume_30d,
            AVG(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS merchant_avg_tx_size_30d,
            COUNT(*) FILTER (WHERE is_confirmed_fraud = TRUE AND created_at >= NOW() - INTERVAL '30 days')::float /
                NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) AS merchant_fraud_rate_30d
        FROM transactions
        GROUP BY merchant_id;
        """
    )
    op.execute("CREATE UNIQUE INDEX idx_merch_agg_merch_id ON merchant_historical_aggregates (merchant_id);")


def downgrade() -> None:
    # 6. Drop Materialized Views
    op.execute("DROP INDEX IF EXISTS idx_merch_agg_merch_id;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS merchant_historical_aggregates;")
    op.execute("DROP INDEX IF EXISTS idx_cust_agg_cust_id;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS customer_historical_aggregates;")

    # 5. Drop tables
    op.drop_index('idx_model_comp_tx_id', table_name='model_comparison_log')
    op.drop_table('model_comparison_log')
    op.drop_table('model_drift_log')
    op.drop_index('idx_model_registry_status', table_name='model_registry')
    op.drop_table('model_registry')
    op.drop_index('idx_risk_rules_active_priority', table_name='risk_rules')
    op.drop_table('risk_rules')

    # 1. Drop columns from organizations
    op.drop_column('organizations', 'threshold_block')
    op.drop_column('organizations', 'threshold_review')
