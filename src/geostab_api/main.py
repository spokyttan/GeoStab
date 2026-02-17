from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

API_KEY = os.getenv("GEOSTAB_API_KEY")

app = FastAPI(
    title="GeoStab API",
    description="Backend para el análisis geotécnico (Sprint 2)"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes (incluyendo file://)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def validate_api_key(request: Request, call_next):
    # Middleware deshabilitado para facilitar demo
    # TODO: Rehabilitar con API Key adecuada para producción final
    return await call_next(request)

from . import models # Importación relativa desde el mismo paquete
from engine import math_engine
from db_utils import queries

@app.get("/")
def read_root():
    """Endpoint raíz para verificar que la API está activa."""
    return {"status": "ok", "message": "GeoStab API is running"}

@app.post("/analyze/planar", response_model=models.AnalysisResult)
def analyze_planar(request: models.PlanarAnalysisRequest):
    """
    Ejecuta el análisis cinemático de falla planar (Sprint 2).
    """
    try:
        # 1. Llamar al motor de Francisca (Sprint 1) 
        # Adaptar inputs para math_engine.planar_failure que espera diccionarios
        talud_dict = {'alpha': request.talud.rumbo, 'beta': request.talud.manteo}
        f1_dict = {'alpha': request.fractura1.rumbo, 'beta': request.fractura1.manteo}
        
        result = math_engine.planar_failure(
            talud=talud_dict,
            fractura=f1_dict,
            phi_deg=request.angulo_friccion
        )
        
        risk_detected = bool(result['risk_detected']) # Convertir numpy.bool a bool nativo
        message = "Análisis planar completado."

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor matemático: {e}")

    # 2. Guardar en la BD de Carlos (Sprint 2) 
    try:
        # Llama a una función en db_utils/queries.py (Dominio de Carlos)
        # para insertar en la tabla MEASUREMENTS 
        queries.save_planar_measurement(
            site_id=request.site_id,
            request_data=request,
            planar_risk=risk_detected,
            project_id=request.project_id
        )
        db_status = "Medición guardada exitosamente."
    except Exception as e:
        # No fallar la solicitud si la BD falla, pero informar
        db_status = f"Error al guardar en BD: {e}"

    # 3. Devolver la respuesta a Valeria (Sprint 3) 
    return models.AnalysisResult(
        risk_detected=risk_detected,
        message=message,
        db_save_status=db_status
    )

# =============================================================================
# ENDPOINTS DE PROYECTOS (Sprint 3)
# =============================================================================

@app.post("/projects")
def create_new_project(request: Request, project: models.ProjectCreate):
    """Crea un nuevo proyecto."""
    try:
        session_id = request.headers.get("X-Session-ID")
        result = queries.create_project(project.name, project.description, session_id=session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects")
def list_projects(request: Request, limit: int = 50):
    """Lista los últimos proyectos filtrados por sesión."""
    try:
        session_id = request.headers.get("X-Session-ID")
        return queries.get_projects(limit, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}", response_model=models.ProjectResponse)
def get_project(project_id: int):
    """Obtiene un proyecto por ID."""
    try:
        project = queries.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/projects/{project_id}")
def update_project(project_id: int, project: models.ProjectUpdate):
    """Actualiza un proyecto."""
    try:
        result = queries.update_project(project_id, project.name, project.description)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    """Elimina un proyecto."""
    try:
        result = queries.delete_project(project_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/wedge", response_model=models.AnalysisResult)
def analyze_wedge(request: models.WedgeAnalysisRequest):
    """
    Ejecuta el análisis cinemático de falla en cuña (Sprint 2).
    (Implementación similar usando math_engine.analyze_wedge_fail)
    """
    try:
        # 1. Llamar al motor de Francisca para obtener los 3 vectores normales
        talud_normal = math_engine.dipdir_dip_to_normal(
            request.talud.rumbo, request.talud.manteo
        )
        f1_normal = math_engine.dipdir_dip_to_normal(
            request.fractura1.rumbo, request.fractura1.manteo
        )
        f2_normal = math_engine.dipdir_dip_to_normal(
            request.fractura2.rumbo, request.fractura2.manteo
        )
        
        # Ejecutar el análisis de cuña
        result = math_engine.wedge_failure(
            nA=f1_normal,
            nB=f2_normal,
            talud_normal=talud_normal,
            phi_deg=request.angulo_friccion
        )
        
        risk_detected = bool(result['risk_detected']) # Convertir numpy.bool a bool nativo
        message = "Análisis en cuña completado."

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor matemático: {e}")

    # 2. Guardar en la BD de Carlos
    try:
        # Se asume que Carlos creará esta función en su dominio
        queries.save_wedge_measurement(
            site_id=request.site_id,
            request_data=request,
            wedge_risk=risk_detected,
            project_id=request.project_id
        )
        db_status = "Medición guardada exitosamente."
    except Exception as e:
        db_status = f"Error al guardar en BD: {e}"

    # 3. Devolver la respuesta a Valeria
    return models.AnalysisResult(
        risk_detected=risk_detected,
        message=message,
        db_save_status=db_status
    )
# =============================================================================
# ENDPOINTS DE FOTOS (Phase 4 - Sensor Integration)
# =============================================================================

@app.post("/photos", status_code=201)
def create_photo(request: Request, photo: models.PhotoCreate):
    """Crear una foto de discontinuidad con metadata de sensores."""
    try:
        session_id = request.headers.get("X-Session-ID") or photo.session_id
        result = queries.create_discontinuity_photo(
            project_id=photo.project_id,
            discontinuity_index=photo.discontinuity_index,
            image_data=photo.image_data,
            dip=photo.dip,
            dip_direction=photo.dip_direction,
            latitude=photo.latitude,
            longitude=photo.longitude,
            gps_accuracy=photo.gps_accuracy,
            captured_at=photo.captured_at.isoformat(),
            session_id=session_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/photos/project/{project_id}")
def get_project_photos(project_id: int, include_images: bool = False):
    """Obtener todas las fotos de un proyecto."""
    try:
        photos = queries.get_photos_by_project(project_id, include_image_data=include_images)
        return {"photos": photos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/photos/{photo_id}")
def get_single_photo(photo_id: int):
    """Obtener una foto específica (incluye IMAGE_DATA)."""
    try:
        photo = queries.get_photo_by_id(photo_id)
        if not photo:
            raise HTTPException(status_code=404, detail="Photo not found")
        return photo
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/photos/{photo_id}")
def remove_photo(photo_id: int):
    """Eliminar una foto."""
    try:
        success = queries.delete_photo(photo_id)
        if not success:
            raise HTTPException(status_code=404, detail="Photo not found")
        return {"success": True, "message": "Photo deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
