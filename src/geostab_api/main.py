from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

API_KEY = os.getenv("GEOSTAB_API_KEY")

app = FastAPI(
    title="GeoStab API",
    description="Backend para el análisis geotécnico (Sprint 2)"
)

@app.middleware("http")
async def validate_api_key(request: Request, call_next):
    # Permitir acceso libre a la documentación, root y openapi
    if request.url.path in ["/", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Si no hay API Key configurada en el servidor, permitir todo (modo dev inseguro)
    # O bloquear todo si prefieres seguridad por defecto. Aquí permitimos si no hay key.
    if not API_KEY:
        return await call_next(request)

    api_key_header = request.headers.get("X-API-Key")
    if api_key_header != API_KEY:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Invalid or missing API Key"}
        )
    
    return await call_next(request)

from. import models # Importación relativa desde el mismo paquete
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
        talud_normal = math_engine.get_normal_vector(
            request.talud.rumbo, request.talud.manteo
        )
        f1_normal = math_engine.get_normal_vector(
            request.fractura1.rumbo, request.fractura1.manteo
        )
        
        risk_detected = math_engine.analyze_planar_fail(
            talud_normal,
            f1_normal,
            request.angulo_friccion
        )
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
            planar_risk=risk_detected
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

@app.post("/analyze/wedge", response_model=models.AnalysisResult)
def analyze_wedge(request: models.WedgeAnalysisRequest):
    """
    Ejecuta el análisis cinemático de falla en cuña (Sprint 2).
    (Implementación similar usando math_engine.analyze_wedge_fail)
    """
    try:
        # 1. Llamar al motor de Francisca para obtener los 3 vectores normales
        talud_normal = math_engine.get_normal_vector(
            request.talud.rumbo, request.talud.manteo
        )
        f1_normal = math_engine.get_normal_vector(
            request.fractura1.rumbo, request.fractura1.manteo
        )
        f2_normal = math_engine.get_normal_vector(
            request.fractura2.rumbo, request.fractura2.manteo
        )
        
        # Ejecutar el análisis de cuña
        risk_detected = math_engine.analyze_wedge_fail(
            talud_normal=talud_normal,
            f1_normal=f1_normal,
            f2_normal=f2_normal,
            angulo_friccion=request.angulo_friccion
        )
        message = "Análisis en cuña completado."

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor matemático: {e}")

    # 2. Guardar en la BD de Carlos
    try:
        # Se asume que Carlos creará esta función en su dominio
        queries.save_wedge_measurement(
            site_id=request.site_id,
            request_data=request,
            wedge_risk=risk_detected
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