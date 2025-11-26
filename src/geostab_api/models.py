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