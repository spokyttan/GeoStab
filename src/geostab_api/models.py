from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BaseMeasurement(BaseModel):
    """Un único conjunto de mediciones geológicas."""
    # Validación de datos: ge=0 (mayor o igual a 0), le=360 (menor o igual a 360)
    rumbo: float = Field(..., ge=0, le=360, description="Rumbo (Strike) del plano (0-360)")
    manteo: float = Field(..., ge=0, le=90, description="Manteo (Dip) del plano (0-90)")

class PlanarAnalysisRequest(BaseModel):
    """Datos necesarios para un análisis de falla planar."""
    talud: BaseMeasurement
    fractura1: BaseMeasurement
    angulo_friccion: float = Field(default=30.0, ge=0, le=90)
    site_id: int # Requerido para guardar en la BD
    project_id: Optional[int] = None # Opcional: vincular a un proyecto

class WedgeAnalysisRequest(BaseModel):
    """Datos necesarios para un análisis de falla en cuña."""
    talud: BaseMeasurement
    fractura1: BaseMeasurement
    fractura2: BaseMeasurement
    angulo_friccion: float = Field(default=30.0, ge=0, le=90)
    site_id: int # Requerido para guardar en la BD
    project_id: Optional[int] = None # Opcional: vincular a un proyecto

class AnalysisResult(BaseModel):
    """Respuesta estandarizada de la API de análisis."""
    risk_detected: bool
    message: str
    db_save_status: str

# --- Modelos de Proyecto ---

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    PROJECT_ID: int
    NAME: str
    DESCRIPTION: Optional[str]
    CREATED_AT: Optional[datetime]
    UPDATED_AT: Optional[datetime]

# --- Modelos de Fotos ---

class PhotoCreate(BaseModel):
    """Modelo para crear una foto de discontinuidad."""
    project_id: int
    discontinuity_index: int
    image_data: str  # Base64 encoded JPEG
    dip: Optional[float] = None
    dip_direction: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy: Optional[float] = None
    captured_at: datetime
    session_id: Optional[str] = None

class PhotoResponse(BaseModel):
    """Respuesta de foto."""
    PHOTO_ID: int
    PROJECT_ID: int
    DISCONTINUITY_INDEX: int
    DIP: Optional[float]
    DIP_DIRECTION: Optional[float]
    LATITUDE: Optional[float]
    LONGITUDE: Optional[float]
    GPS_ACCURACY: Optional[float]
    CAPTURED_AT: datetime
    CREATED_AT: datetime
    # Note: IMAGE_DATA can be excluded from response to reduce payload size
    # or included optionally via query parameter