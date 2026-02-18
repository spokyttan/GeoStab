# src/db_utils/queries.py
"""
Módulo de consultas a la base de datos GeoStab
Responsable: Carlos (con ayuda de Nattan)

Este módulo maneja todas las operaciones de escritura/lectura
a la base de datos PostgreSQL (migrado desde MySQL).
"""

from datetime import datetime
import logging
from typing import Optional, Dict, Any
from psycopg2.extras import RealDictCursor
from .connection import get_db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def save_planar_measurement(
    site_id: int,
    request_data: Any,  # PlanarAnalysisRequest de Pydantic
    planar_risk: bool,
    project_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Guarda una medición de análisis planar en la base de datos.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Query de inserción
            query = """
                INSERT INTO MEASUREMENTS (
                    SITE_ID,
                    SLOPE_STRIKE,
                    SLOPE_DIP,
                    F1_STRIKE,
                    F1_DIP,
                    FRICTION_ANGLE,
                    PLANAR_RISK_DETECTED,
                    MEASURED_AT,
                    PROJECT_ID
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING MEASUREMENT_ID
            """
            
            # Preparar datos
            values = (
                site_id,
                request_data.talud.rumbo,
                request_data.talud.manteo,
                request_data.fractura1.rumbo,
                request_data.fractura1.manteo,
                request_data.angulo_friccion,
                planar_risk,
                datetime.now(),
                project_id
            )
            
            cursor.execute(query, values)
            measurement_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"✅ Medición planar guardada con ID: {measurement_id}")
            
            return {
                "success": True,
                "measurement_id": measurement_id,
                "message": f"Medición planar guardada exitosamente (ID: {measurement_id})"
            }
            
    except Exception as e:
        logger.error(f"❌ Error al guardar medición planar: {e}", exc_info=True)
        raise


def save_wedge_measurement(
    site_id: int,
    request_data: Any,  # WedgeAnalysisRequest de Pydantic
    wedge_risk: bool,
    project_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Guarda una medición de análisis en cuña en la base de datos.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Query de inserción para análisis en cuña
            query = """
                INSERT INTO MEASUREMENTS (
                    SITE_ID,
                    SLOPE_STRIKE,
                    SLOPE_DIP,
                    F1_STRIKE,
                    F1_DIP,
                    F2_STRIKE,
                    F2_DIP,
                    FRICTION_ANGLE,
                    WEDGE_RISK_DETECTED,
                    MEASURED_AT,
                    PROJECT_ID
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING MEASUREMENT_ID
            """
            
            # Preparar datos
            values = (
                site_id,
                request_data.talud.rumbo,
                request_data.talud.manteo,
                request_data.fractura1.rumbo,
                request_data.fractura1.manteo,
                request_data.fractura2.rumbo,
                request_data.fractura2.manteo,
                request_data.angulo_friccion,
                wedge_risk,
                datetime.now(),
                project_id
            )
            
            cursor.execute(query, values)
            measurement_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"✅ Medición en cuña guardada con ID: {measurement_id}")
            
            return {
                "success": True,
                "measurement_id": measurement_id,
                "message": f"Medición en cuña guardada exitosamente (ID: {measurement_id})"
            }
            
    except Exception as e:
        logger.error(f"❌ Error al guardar medición en cuña: {e}", exc_info=True)
        raise


def get_site_measurements(site_id: int, limit: int = 50) -> list:
    """
    Obtiene las últimas mediciones de un sitio específico.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    MEASUREMENT_ID as id,
                    SLOPE_STRIKE as talud_rumbo,
                    SLOPE_DIP as talud_manteo,
                    F1_STRIKE as fractura1_rumbo,
                    F1_DIP as fractura1_manteo,
                    F2_STRIKE as fractura2_rumbo,
                    F2_DIP as fractura2_manteo,
                    FRICTION_ANGLE as angulo_friccion,
                    PLANAR_RISK_DETECTED as planar_risk_detected,
                    WEDGE_RISK_DETECTED as wedge_risk_detected,
                    MEASURED_AT as measurement_date
                FROM MEASUREMENTS
                WHERE SITE_ID = %s
                ORDER BY MEASURED_AT DESC
                LIMIT %s
            """
            
            cursor.execute(query, (site_id, limit))
            measurements = cursor.fetchall()
            
            logger.info(f"📊 {len(measurements)} mediciones obtenidas para sitio {site_id}")
            
            return measurements
            
    except Exception as e:
        logger.error(f"❌ Error al obtener mediciones: {e}", exc_info=True)
        raise


def get_risk_summary(site_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Obtiene un resumen de riesgos detectados.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if site_id:
                query = """
                    SELECT 
                        COUNT(*) as total_measurements,
                        SUM(CASE WHEN PLANAR_RISK_DETECTED = TRUE THEN 1 ELSE 0 END) as planar_risks,
                        SUM(CASE WHEN WEDGE_RISK_DETECTED = TRUE THEN 1 ELSE 0 END) as wedge_risks,
                        MAX(MEASURED_AT) as last_measurement
                    FROM MEASUREMENTS
                    WHERE SITE_ID = %s
                """
                cursor.execute(query, (site_id,))
            else:
                query = """
                    SELECT 
                        COUNT(*) as total_measurements,
                        SUM(CASE WHEN PLANAR_RISK_DETECTED = TRUE THEN 1 ELSE 0 END) as planar_risks,
                        SUM(CASE WHEN WEDGE_RISK_DETECTED = TRUE THEN 1 ELSE 0 END) as wedge_risks,
                        MAX(MEASURED_AT) as last_measurement,
                        COUNT(DISTINCT SITE_ID) as total_sites
                    FROM MEASUREMENTS
                """
                cursor.execute(query)
            
            summary = cursor.fetchone()
            
            logger.info(f"📈 Resumen de riesgos generado")
            
            return summary
            
    except Exception as e:
        logger.error(f"❌ Error al obtener resumen: {e}", exc_info=True)
        raise


def delete_measurement(measurement_id: int) -> Dict[str, Any]:
    """
    Elimina una medición de la base de datos.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            query = "DELETE FROM MEASUREMENTS WHERE MEASUREMENT_ID = %s"
            cursor.execute(query, (measurement_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                logger.info(f"🗑️ Medición {measurement_id} eliminada")
                return {
                    "success": True,
                    "message": f"Medición {measurement_id} eliminada exitosamente"
                }
            else:
                return {
                    "success": False,
                    "message": f"No se encontró medición con ID {measurement_id}"
                }
                
    except Exception as e:
        logger.error(f"❌ Error al eliminar medición: {e}", exc_info=True)
        raise



# =============================================================================
# GESTIÓN DE PROYECTOS
# =============================================================================

def create_project(name: str, description: Optional[str] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Crea un nuevo proyecto.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = "INSERT INTO PROJECTS (NAME, DESCRIPTION, CREATED_AT, UPDATED_AT, SESSION_ID) VALUES (%s, %s, %s, %s, %s) RETURNING PROJECT_ID"
            now = datetime.now()
            cursor.execute(query, (name, description, now, now, session_id))
            project_id = cursor.fetchone()[0]
            conn.commit()
            logger.info(f"✅ Proyecto creado con ID: {project_id} (Sesión: {session_id})")
            return {"success": True, "project_id": project_id, "message": f"Proyecto '{name}' creado"}
    except Exception as e:
        logger.error(f"❌ Error al crear proyecto: {e}", exc_info=True)
        raise

def get_projects(limit: int = 50, session_id: Optional[str] = None) -> list:
    """
    Obtiene lista de proyectos, opcionalmente filtrados por SESSION_ID.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            if session_id:
                query = "SELECT * FROM PROJECTS WHERE SESSION_ID = %s ORDER BY UPDATED_AT DESC LIMIT %s"
                cursor.execute(query, (session_id, limit))
            else:
                query = "SELECT * FROM PROJECTS ORDER BY UPDATED_AT DESC LIMIT %s"
                cursor.execute(query, (limit,))
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"❌ Error al obtener proyectos: {e}", exc_info=True)
        raise

def get_project_by_id(project_id: int) -> Optional[Dict[str, Any]]:
    """
    Obtiene un proyecto por su ID.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT * FROM PROJECTS WHERE PROJECT_ID = %s"
            cursor.execute(query, (project_id,))
            return cursor.fetchone()
    except Exception as e:
        logger.error(f"❌ Error al obtener proyecto {project_id}: {e}", exc_info=True)
        raise

def update_project(project_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
    """
    Actualiza un proyecto existente.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            updates = []
            values = []
            if name:
                updates.append("NAME = %s")
                values.append(name)
            if description:
                updates.append("DESCRIPTION = %s")
                values.append(description)
            
            if not updates:
                return {"success": False, "message": "No hay cambios para actualizar"}
            
            updates.append("UPDATED_AT = %s")
            values.append(datetime.now())
            values.append(project_id)
            
            # Nota: psycopg2 usa %s, igual que antes.
            query = f"UPDATE PROJECTS SET {', '.join(updates)} WHERE PROJECT_ID = %s"
            cursor.execute(query, tuple(values))
            conn.commit()
            
            if cursor.rowcount > 0:
                return {"success": True, "message": f"Proyecto {project_id} actualizado"}
            return {"success": False, "message": "Proyecto no encontrado"}
    except Exception as e:
        logger.error(f"❌ Error al actualizar proyecto: {e}", exc_info=True)
        raise

def delete_project(project_id: int) -> Dict[str, Any]:
    """
    Elimina un proyecto (y sus mediciones asociadas si no hay restricción FK).
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Primero desvincular mediciones (o eliminarlas, según regla de negocio. Aquí desvinculamos)
            cursor.execute("UPDATE MEASUREMENTS SET PROJECT_ID = NULL WHERE PROJECT_ID = %s", (project_id,))
            
            cursor.execute("DELETE FROM PROJECTS WHERE PROJECT_ID = %s", (project_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                return {"success": True, "message": f"Proyecto {project_id} eliminado"}
            return {"success": False, "message": "Proyecto no encontrado"}
    except Exception as e:
        logger.error(f"❌ Error al eliminar proyecto: {e}", exc_info=True)
        raise


# =============================================================================
# GESTIÓN DE FOTOS DE DISCONTINUIDADES
# =============================================================================

def create_discontinuity_photo(
    project_id: int,
    discontinuity_index: int,
    image_data: str,
    dip: Optional[float] = None,
    dip_direction: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    gps_accuracy: Optional[float] = None,
    captured_at: str = None,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """Guarda una foto de discontinuidad con metadata de sensores."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = """
            INSERT INTO DISCONTINUITY_PHOTOS 
            (PROJECT_ID, DISCONTINUITY_INDEX, IMAGE_DATA, DIP, DIP_DIRECTION, 
             LATITUDE, LONGITUDE, GPS_ACCURACY, CAPTURED_AT, SESSION_ID)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING PHOTO_ID
            """
            cursor.execute(query, (
                project_id, discontinuity_index, image_data, dip, dip_direction,
                latitude, longitude, gps_accuracy, captured_at, session_id
            ))
            photo_id = cursor.fetchone()[0]
            conn.commit()
            logger.info(f"✅ Foto guardada con ID: {photo_id}")
            return {"success": True, "photo_id": photo_id}
    except Exception as e:
        logger.error(f"❌ Error al guardar foto: {e}", exc_info=True)
        raise

def get_photos_by_project(project_id: int, include_image_data: bool = False) -> list:
    """Obtiene todas las fotos de un proyecto."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            if include_image_data:
                query = "SELECT * FROM DISCONTINUITY_PHOTOS WHERE PROJECT_ID = %s ORDER BY CAPTURED_AT DESC"
            else:
                query = """
                SELECT PHOTO_ID, PROJECT_ID, DISCONTINUITY_INDEX, DIP, DIP_DIRECTION,
                       LATITUDE, LONGITUDE, GPS_ACCURACY, CAPTURED_AT, CREATED_AT, SESSION_ID
                FROM DISCONTINUITY_PHOTOS WHERE PROJECT_ID = %s ORDER BY CAPTURED_AT DESC
                """
            cursor.execute(query, (project_id,))
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"❌ Error al obtener fotos del proyecto {project_id}: {e}", exc_info=True)
        raise

def get_photo_by_id(photo_id: int) -> Optional[Dict[str, Any]]:
    """Obtiene una foto específica por ID (incluye IMAGE_DATA)."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT * FROM DISCONTINUITY_PHOTOS WHERE PHOTO_ID = %s"
            cursor.execute(query, (photo_id,))
            return cursor.fetchone()
    except Exception as e:
        logger.error(f"❌ Error al obtener foto {photo_id}: {e}", exc_info=True)
        raise

def delete_photo(photo_id: int) -> bool:
    """Elimina una foto por ID."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = "DELETE FROM DISCONTINUITY_PHOTOS WHERE PHOTO_ID = %s"
            cursor.execute(query, (photo_id,))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"❌ Error al eliminar foto {photo_id}: {e}", exc_info=True)
        raise

if __name__ == '__main__':
    """
    Script de prueba para verificar que las funciones funcionan.
    Ejecutar con: python -m src.db_utils.queries
    """
    from dotenv import load_dotenv
    import os
    from pathlib import Path

    # Encontrar el archivo .env en la raíz del proyecto
    project_root = Path(__file__).parent.parent.parent
    dotenv_path = project_root / '.env'

    print(f"📂 Buscando .env en: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)

    # Nota: No necesitamos configurar os.environ['MYSQL_...'] porque connection.py usa DATABASE_URL
    # y ya hemos cargado el .env.

    print("=" * 60)
    print("🧪 PRUEBAS DE QUERIES (PostgreSQL)")
    print("=" * 60)

    # We can use logger here too, but for CLI test script prints are fine.
