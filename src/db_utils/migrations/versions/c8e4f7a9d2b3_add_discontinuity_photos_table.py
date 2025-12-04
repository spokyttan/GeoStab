"""add discontinuity photos table

Revision ID: c8e4f7a9d2b3
Revises: b2f8c9d1e4a7
Create Date: 2025-12-04 11:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c8e4f7a9d2b3'
down_revision = 'b2f8c9d1e4a7'
branch_labels = None
depends_on = None


def upgrade():
    # Create DISCONTINUITY_PHOTOS table for storing photos with metadata
    op.create_table(
        'DISCONTINUITY_PHOTOS',
        sa.Column('PHOTO_ID', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('PROJECT_ID', sa.Integer(), nullable=False),
        sa.Column('DISCONTINUITY_INDEX', sa.Integer(), nullable=False),
        sa.Column('IMAGE_DATA', sa.Text(), nullable=False),  # Base64 encoded JPEG
        sa.Column('DIP', sa.Float(), nullable=True),
        sa.Column('DIP_DIRECTION', sa.Float(), nullable=True),
        sa.Column('LATITUDE', sa.Float(), nullable=True),
        sa.Column('LONGITUDE', sa.Float(), nullable=True),
        sa.Column('GPS_ACCURACY', sa.Float(), nullable=True),
        sa.Column('CAPTURED_AT', sa.DateTime(), nullable=False),
        sa.Column('SESSION_ID', sa.String(36), nullable=True),
        sa.Column('CREATED_AT', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('PHOTO_ID')
    )
    
    # Create index for faster queries by project and session
    op.create_index('idx_photos_project', 'DISCONTINUITY_PHOTOS', ['PROJECT_ID'])
    op.create_index('idx_photos_session', 'DISCONTINUITY_PHOTOS', ['SESSION_ID'])


def downgrade():
    op.drop_index('idx_photos_session', 'DISCONTINUITY_PHOTOS')
    op.drop_index('idx_photos_project', 'DISCONTINUITY_PHOTOS')
    op.drop_table('DISCONTINUITY_PHOTOS')
