"""create transaction outcomes table and explainability columns

Revision ID: transaction_outcomes
Revises: fraud_type_tables
Create Date: 2026-09-05 18:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'transaction_outcomes'
down_revision: Union[str, None] = 'fraud_type_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add explainability and feedback columns to transactions
    op.add_column('transactions', sa.Column('signals_json', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True))
    op.add_column('transactions', sa.Column('decision_details', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True))
    op.add_column('transactions', sa.Column('challenge_method', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('feedback_label', sa.Integer(), nullable=True))

    # 2. Create transaction_outcomes table
    op.create_table(
        'transaction_outcomes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('original_decision', sa.String(length=20), nullable=True),
        sa.Column('original_risk_score', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('outcome_type', sa.String(length=30), nullable=False),
        sa.Column('outcome_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('days_after_transaction', sa.Integer(), nullable=True),
        sa.Column('outcome_source', sa.String(length=30), nullable=True),
        sa.Column('feedback_label', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 3. Create indexes for efficient querying
    op.create_index('idx_tx_outcomes_tx_id', 'transaction_outcomes', ['transaction_id'])
    op.create_index('idx_tx_outcomes_org_id', 'transaction_outcomes', ['org_id'])
    op.create_index('idx_tx_outcomes_type', 'transaction_outcomes', ['outcome_type'])
    op.create_index('idx_tx_outcomes_feedback', 'transaction_outcomes', ['feedback_label'])
    op.create_index('idx_tx_outcomes_created_at', 'transaction_outcomes', ['created_at'])


def downgrade() -> None:
    # Drop indexes and transaction_outcomes table
    op.drop_index('idx_tx_outcomes_created_at', table_name='transaction_outcomes')
    op.drop_index('idx_tx_outcomes_feedback', table_name='transaction_outcomes')
    op.drop_index('idx_tx_outcomes_type', table_name='transaction_outcomes')
    op.drop_index('idx_tx_outcomes_org_id', table_name='transaction_outcomes')
    op.drop_index('idx_tx_outcomes_tx_id', table_name='transaction_outcomes')
    op.drop_table('transaction_outcomes')

    # Drop added columns from transactions
    op.drop_column('transactions', 'feedback_label')
    op.drop_column('transactions', 'challenge_method')
    op.drop_column('transactions', 'decision_details')
    op.drop_column('transactions', 'signals_json')
