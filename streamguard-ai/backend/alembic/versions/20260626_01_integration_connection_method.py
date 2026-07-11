"""integration connection method

Revision ID: integration_method
Revises: legal_tables
Create Date: 2026-06-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'integration_method'
down_revision: Union[str, None] = 'legal_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create table integrations if not exists
    op.create_table(
        'integrations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('platform', sa.String(length=50), server_default='unknown', nullable=False),
        sa.Column('connection_method', sa.String(length=20), server_default='script', nullable=False),
        sa.Column('store_name', sa.String(length=255), nullable=True),
        sa.Column('store_url', sa.Text(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('webhook_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('detected_url', sa.Text(), nullable=True),
        sa.Column('detection_confidence', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_event_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index('idx_integrations_org_id', 'integrations', ['org_id'])

def downgrade() -> None:
    op.drop_index('idx_integrations_org_id', table_name='integrations')
    op.drop_table('integrations')
