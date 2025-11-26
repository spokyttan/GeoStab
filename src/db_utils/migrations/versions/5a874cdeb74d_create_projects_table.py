"""create projects table

Revision ID: 5a874cdeb74d
Revises: 
Create Date: 2025-11-24 16:12:43.319482

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a874cdeb74d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create PROJECTS table
    op.create_table(
        'PROJECTS',
        sa.Column('PROJECT_ID', sa.Integer(), nullable=False),
        sa.Column('NAME', sa.String(length=255), nullable=False),
        sa.Column('DESCRIPTION', sa.Text(), nullable=True),
        sa.Column('CREATED_AT', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('UPDATED_AT', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('PROJECT_ID')
    )
    
    # Add PROJECT_ID to MEASUREMENTS
    op.add_column('MEASUREMENTS', sa.Column('PROJECT_ID', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_measurements_projects', 'MEASUREMENTS', 'PROJECTS', ['PROJECT_ID'], ['PROJECT_ID'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_measurements_projects', 'MEASUREMENTS', type_='foreignkey')
    op.drop_column('MEASUREMENTS', 'PROJECT_ID')
    op.drop_table('PROJECTS')
