# (En main.py)
from fastapi import FastAPI, HTTPException, Depends
import numpy as np
import oracledb
from typing import Dict

# Importar sus dependencias de equipo
import schemas
from database import get_db_connection  # De Carlos 
from engine.math_engine import (
    get_normal_vector,      # De Francisca 
    analyze_planar_fail,    # De Francisca 
    analyze_wedge_fail      # De Francisca 
)

app = FastAPI(title="GeoStab API")

# --- ENDPOINTS DE ANÁLISIS ---

@app.post("/analyze/planar", response_model=schemas.AnalysisResponse)
async def api_analyze_planar(req: schemas.PlanarAnalysisRequest):
    """
    Ejecuta el análisis cinemático de falla planar.
    Llama al motor de Numpy de Francisca.
    """
    try:
        # 1. Convertir ángulos a vectores 
        talud_normal = get_normal_vector(req.slope_strike, req.slope_dip)
        f1_normal = get_normal_vector(req.f1_strike, req.f1_dip)
        
        # 2. Ejecutar análisis 
        is_risk = analyze_planar_fail(
            talud_normal,
            f1_normal,
            req.friction_angle
        )
        
        msg = "RIESGO DETECTADO" if is_risk else "Condiciones Estables"
        return {"risk_detected": is_risk, "message": msg}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error del motor matemático: {e}")

@app.post("/analyze/wedge", response_model=schemas.AnalysisResponse)
async def api_analyze_wedge(req: schemas.WedgeAnalysisRequest):
    """
    Ejecuta el análisis cinemático de falla en cuña.
    Llama al motor de Numpy de Francisca.
    """
    if req.f2_strike is None or req.f2_dip is None:
        raise HTTPException(status_code=400, detail="Se requieren datos de la Fractura 2 para análisis en cuña.")
        
    try:
        # 1. Convertir ángulos a vectores 
        talud_normal = get_normal_vector(req.slope_strike, req.slope_dip)
        f1_normal = get_normal_vector(req.f1_strike, req.f1_dip)
        f2_normal = get_normal_vector(req.f2_strike, req.f2_dip)

        # 2. Ejecutar análisis 
        is_risk = analyze_wedge_fail(
            talud_normal,
            f1_normal,
            f2_normal,
            req.friction_angle
        )
        
        msg = "RIESGO DETECTADO" if is_risk else "Condiciones Estables"
        return {"risk_detected": is_risk, "message": msg}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error del motor matemático: {e}")

# --- ENDPOINT DE PERSISTENCIA (BASE de DATOS) ---

@app.post("/save_measurement", response_model=Dict[str, str])
async def api_save_measurement(
    req: schemas.MeasurementRecord,
    conn: oracledb.Connection = Depends(get_db_connection)
):
    """
    Guarda una medición completa en la Base de Datos Oracle.
    Utiliza la conexión de Carlos  y el DDL.
    """
    if not conn:
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos Oracle.")
    
    # SQL basado en la tabla MEASUREMENTS 
    sql = """
        INSERT INTO MEASUREMENTS (
            SITE_ID, INPUT_METHOD, 
            SLOPE_STRIKE, SLOPE_DIP, 
            F1_STRIKE, F1_DIP, 
            F2_STRIKE, F2_DIP,
            FRICTION_ANGLE,
            PLANAR_RISK_DETECTED, WEDGE_RISK_DETECTED
        ) VALUES (
            :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11
        )
    """
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql,)
        conn.commit()
        return {"status": "success", "message": "Medición guardada en Oracle DB."}
    except oracledb.DatabaseError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error de Oracle DB: {e}")
    finally:
        if conn:
            conn.close()