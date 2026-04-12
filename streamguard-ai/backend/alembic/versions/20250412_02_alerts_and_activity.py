"""alerts and activity

Revision ID: 20250412_02
Revises: 20250412_01
Create Date: 2025-04-12 13:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250412_02'
down_revision = '20250412_01'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Update existing alerts table with updated_at if missing
    op.add_column('alerts', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    
    # 2. Create alert_activity table
    op.create_table('alert_activity',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('alert_id', sa.UUID(), nullable=False),
        sa.Column('org_id', sa.UUID(), nullable=False),
        sa.Column('from_status', sa.String(length=20), nullable=True),
        sa.Column('to_status', sa.String(length=20), nullable=False),
        sa.Column('changed_by', sa.UUID(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Add Indexes (Avoiding duplicates found in initial schema)
    # op.create_index('idx_alerts_org_status', 'alerts', ['org_id', 'status', sa.text('created_at DESC')], unique=False) # Skip
    op.create_index('idx_alerts_org_severity', 'alerts', ['org_id', 'severity', sa.text('created_at DESC')], unique=False)
    op.create_index('idx_activity_alert', 'alert_activity', ['alert_id', sa.text('created_at DESC')], unique=False)


def downgrade():
    op.drop_index('idx_activity_alert', table_name='alert_activity')
    op.drop_index('idx_alerts_org_severity', table_name='alerts')
    op.drop_table('alert_activity')
    op.drop_column('alerts', 'updated_at')
