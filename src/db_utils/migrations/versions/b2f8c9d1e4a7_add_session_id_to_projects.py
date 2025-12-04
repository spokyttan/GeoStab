"""add session_id to projects

Revision ID: b2f8c9d1e4a7
Revises: 5a874cdeb74d
Create Date: 2025-12-04 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2f8c9d1e4a7'
down_revision = '5a874cdeb74d'
branch_labels = None
depends_on = None


def upgrade():
    # Add SESSION_ID column to PROJECTS table
    op.add_column('PROJECTS', sa.Column('SESSION_ID', sa.String(36), nullable=True))


def downgrade():
    # Remove SESSION_ID column
    op.drop_column('PROJECTS', 'SESSION_ID')
