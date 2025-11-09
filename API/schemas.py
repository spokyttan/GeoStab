# (En schemas.py)
from pydantic import BaseModel, Field
from typing import Optional

# Modelo base para datos geológicos compartidos
class GeoDataInput(BaseModel):
    slope_strike: float = Field(..., ge=0, le=360)
    slope_dip: float = Field(..., ge=0, le=90)
    friction_angle: float = Field(default=30.0, ge=0, le=90)

# Esquema para el análisis Planar
# Basado en las entradas de Streamlit 
class PlanarAnalysisRequest(GeoDataInput):
    f1_strike: float = Field(..., ge=0, le=360)
    f1_dip: float = Field(..., ge=0, le=90)

# Esquema para el análisis en Cuña
class WedgeAnalysisRequest(PlanarAnalysisRequest):
    f2_strike: Optional[float] = Field(None, ge=0, le=360)
    f2_dip: Optional[float] = Field(None, ge=0, le=90)

# Esquema para la respuesta del análisis
# Basado en la respuesta esperada por Streamlit 
class AnalysisResponse(BaseModel):
    risk_detected: bool
    message: str

# Esquema para guardar una medición completa en la BD
# Basado en la Tabla MEASUREMENTS 
class MeasurementRecord(BaseModel):
    site_id: int
    input_method: str = Field(..., pattern="^(MANUAL|SENSOR)$")
    slope_strike: float
    slope_dip: float
    f1_strike: float
    f1_dip: float
    f2_strike: Optional[float] = None
    f2_dip: Optional[float] = None
    friction_angle: float = 30.0
    planar_risk_detected: bool
    wedge_risk_detected: bool