# src/db_utils/queries.py
"""
Módulo de consultas a la base de datos GeoStab
Responsable: Carlos (con ayuda de Nattan)

Este módulo maneja todas las operaciones de escritura/lectura
a la base de datos MySQL externa de INACAP.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from .connection import get_db_connection


def save_planar_measurement(
    site_id: int,
    request_data: Any,  # PlanarAnalysisRequest de Pydantic
    planar_risk: bool,
    project_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Guarda una medición de análisis planar en la base de datos.
    
    Args:
        site_id: ID del sitio donde se hizo la medición
        request_data: Objeto con datos del análisis (rumbo, manteo, ángulo fricción)
        planar_risk: Resultado del análisis (True=riesgo detectado, False=seguro)
    
    Returns:
        Dict con el ID de la medición creada y status
    
    Raises:
        Exception: Si hay error en la inserción
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
                )
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
            conn.commit()
            
            # Obtener el ID del registro insertado
            measurement_id = cursor.lastrowid
            
            print(f"✅ Medición planar guardada con ID: {measurement_id}")
            
            return {
                "success": True,
                "measurement_id": measurement_id,
                "message": f"Medición planar guardada exitosamente (ID: {measurement_id})"
            }
            
    except Exception as e:
        print(f"❌ Error al guardar medición planar: {e}")
        raise


def save_wedge_measurement(
    site_id: int,
    request_data: Any,  # WedgeAnalysisRequest de Pydantic
    wedge_risk: bool,
    project_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Guarda una medición de análisis en cuña en la base de datos.
    
    Args:
        site_id: ID del sitio donde se hizo la medición
        request_data: Objeto con datos del análisis (rumbo, manteo de 3 planos)
        wedge_risk: Resultado del análisis (True=riesgo detectado, False=seguro)
    
    Returns:
        Dict con el ID de la medición creada y status
    
    Raises:
        Exception: Si hay error en la inserción
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
                )
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
            conn.commit()
            
            measurement_id = cursor.lastrowid
            
            print(f"✅ Medición en cuña guardada con ID: {measurement_id}")
            
            return {
                "success": True,
                "measurement_id": measurement_id,
                "message": f"Medición en cuña guardada exitosamente (ID: {measurement_id})"
            }
            
    except Exception as e:
        print(f"❌ Error al guardar medición en cuña: {e}")
        raise


def get_site_measurements(site_id: int, limit: int = 50) -> list:
    """
    Obtiene las últimas mediciones de un sitio específico.
    
    Args:
        site_id: ID del sitio
        limit: Número máximo de registros a retornar (default: 50)
    
    Returns:
        Lista de diccionarios con las mediciones
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            
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
            
            print(f"📊 {len(measurements)} mediciones obtenidas para sitio {site_id}")
            
            return measurements
            
    except Exception as e:
        print(f"❌ Error al obtener mediciones: {e}")
        raise


def get_risk_summary(site_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Obtiene un resumen de riesgos detectados.
    
    Args:
        site_id: ID del sitio (opcional). Si no se proporciona, resume todos los sitios.
    
    Returns:
        Dict con estadísticas de riesgo
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            
            if site_id:
                query = """
                    SELECT 
                        COUNT(*) as total_measurements,
                        SUM(CASE WHEN PLANAR_RISK_DETECTED = 1 THEN 1 ELSE 0 END) as planar_risks,
                        SUM(CASE WHEN WEDGE_RISK_DETECTED = 1 THEN 1 ELSE 0 END) as wedge_risks,
                        MAX(MEASURED_AT) as last_measurement
                    FROM MEASUREMENTS
                    WHERE SITE_ID = %s
                """
                cursor.execute(query, (site_id,))
            else:
                query = """
                    SELECT 
                        COUNT(*) as total_measurements,
                        SUM(CASE WHEN PLANAR_RISK_DETECTED = 1 THEN 1 ELSE 0 END) as planar_risks,
                        SUM(CASE WHEN WEDGE_RISK_DETECTED = 1 THEN 1 ELSE 0 END) as wedge_risks,
                        MAX(MEASURED_AT) as last_measurement,
                        COUNT(DISTINCT SITE_ID) as total_sites
                    FROM MEASUREMENTS
                """
                cursor.execute(query)
            
            summary = cursor.fetchone()
            
            print(f"📈 Resumen de riesgos generado")
            
            return summary
            
    except Exception as e:
        print(f"❌ Error al obtener resumen: {e}")
        raise


def delete_measurement(measurement_id: int) -> Dict[str, Any]:
    """
    Elimina una medición de la base de datos.
    
    Args:
        measurement_id: ID de la medición a eliminar
    
    Returns:
        Dict con resultado de la operación
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            query = "DELETE FROM MEASUREMENTS WHERE MEASUREMENT_ID = %s"
            cursor.execute(query, (measurement_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                print(f"🗑️ Medición {measurement_id} eliminada")
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
        print(f"❌ Error al eliminar medición: {e}")
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
            query = "INSERT INTO PROJECTS (NAME, DESCRIPTION, CREATED_AT, UPDATED_AT, SESSION_ID) VALUES (%s, %s, %s, %s, %s)"
            now = datetime.now()
            cursor.execute(query, (name, description, now, now, session_id))
            conn.commit()
            project_id = cursor.lastrowid
            print(f"✅ Proyecto creado con ID: {project_id} (Sesión: {session_id})")
            return {"success": True, "project_id": project_id, "message": f"Proyecto '{name}' creado"}
    except Exception as e:
        print(f"❌ Error al crear proyecto: {e}")
        raise

def get_projects(limit: int = 50, session_id: Optional[str] = None) -> list:
    """
    Obtiene lista de proyectos, opcionalmente filtrados por SESSION_ID.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            if session_id:
                query = "SELECT * FROM PROJECTS WHERE SESSION_ID = %s ORDER BY UPDATED_AT DESC LIMIT %s"
                cursor.execute(query, (session_id, limit))
            else:
                query = "SELECT * FROM PROJECTS ORDER BY UPDATED_AT DESC LIMIT %s"
                cursor.execute(query, (limit,))
            return cursor.fetchall()
    except Exception as e:
        print(f"❌ Error al obtener proyectos: {e}")
        raise

def get_project_by_id(project_id: int) -> Optional[Dict[str, Any]]:
    """
    Obtiene un proyecto por su ID.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM PROJECTS WHERE PROJECT_ID = %s"
            cursor.execute(query, (project_id,))
            return cursor.fetchone()
    except Exception as e:
        print(f"❌ Error al obtener proyecto {project_id}: {e}")
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
            
            query = f"UPDATE PROJECTS SET {', '.join(updates)} WHERE PROJECT_ID = %s"
            cursor.execute(query, tuple(values))
            conn.commit()
            
            if cursor.rowcount > 0:
                return {"success": True, "message": f"Proyecto {project_id} actualizado"}
            return {"success": False, "message": "Proyecto no encontrado"}
    except Exception as e:
        print(f"❌ Error al actualizar proyecto: {e}")
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
        print(f"❌ Error al eliminar proyecto: {e}")
        raise


# =============================================================================
# SCRIPT DE PRUEBA
# =============================================================================
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
    
    if not dotenv_path.exists():
        print(f"❌ ERROR: No se encontró .env en {dotenv_path}")
        exit(1)
    
    # Cargar variables de entorno
    load_dotenv(dotenv_path=dotenv_path)
    
    # Configurar variables para connection.py
    os.environ['MYSQL_HOST'] = os.getenv('INACAP_DB_HOST')
    os.environ['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD_SECRET')
    os.environ['MYSQL_USER'] = 'capitan'
    os.environ['MYSQL_DATABASE'] = 'GeoStab'
    
    print(f"✅ Variables cargadas desde {dotenv_path}")
    
    print("=" * 60)
    print("🧪 PRUEBAS DE QUERIES (INCLUYENDO PROYECTOS)")
    print("=" * 60)
    
    # Mocks
    class MockMeasurement:
        def __init__(self, rumbo, manteo):
            self.rumbo = rumbo
            self.manteo = manteo
    
    class MockPlanarRequest:
        def __init__(self):
            self.talud = MockMeasurement(135, 60)
            self.fractura1 = MockMeasurement(135, 45)
            self.angulo_friccion = 30.0
    
    try:
        # 0️⃣ Crear Proyecto de Prueba
        print("\n0️⃣ Creando Proyecto de Prueba...")
        proj_res = create_project("Proyecto Test Auto", "Descripción de prueba")
        project_id = proj_res['project_id']
        print(f"   Resultado: {proj_res}")

        # 1️⃣ Crear sitio de prueba
        print("\n1️⃣ Creando sitio de prueba...")
        test_site_id = 9999
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM SITES WHERE SITE_ID = %s", (test_site_id,))
            conn.commit()
            cursor.execute(
                "INSERT INTO SITES (SITE_ID, SITE_NAME) VALUES (%s, %s)",
                (test_site_id, "Sitio de Prueba Auto")
            )
            conn.commit()
            print(f"   Sitio creado con ID: {test_site_id}")

        # 2️⃣ Guardar medición vinculada al proyecto
        print("\n2️⃣ Guardar medición vinculada al proyecto...")
        planar_req = MockPlanarRequest()
        result_planar = save_planar_measurement(
            site_id=test_site_id, 
            request_data=planar_req, 
            planar_risk=True,
            project_id=project_id
        )
        print(f"   Resultado: {result_planar}")
        
        # 3️⃣ Listar Proyectos
        print("\n3️⃣ Listar Proyectos...")
        projects = get_projects(limit=5)
        print(f"   Proyectos encontrados: {len(projects)}")
        print(f"   Último proyecto: {projects[0]}")

        # 4️⃣ Actualizar Proyecto
        print("\n4️⃣ Actualizar Proyecto...")
        update_res = update_project(project_id, name="Proyecto Test Actualizado")
        print(f"   Resultado: {update_res}")

        # 5️⃣ Limpieza
        print("\n5️⃣ Limpieza...")
        if result_planar['success']:
            delete_measurement(result_planar['measurement_id'])
        
        delete_project(project_id)
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM SITES WHERE SITE_ID = %s", (test_site_id,))
            conn.commit()
            print("   Sitio de prueba eliminado.")
        
        print("\n" + "=" * 60)
        print("✅ TODAS LAS PRUEBAS PASARON")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR EN PRUEBAS: {e}")
        print("=" * 60)
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
            """
            cursor.execute(query, (
                project_id, discontinuity_index, image_data, dip, dip_direction,
                latitude, longitude, gps_accuracy, captured_at, session_id
            ))
            conn.commit()
            photo_id = cursor.lastrowid
            print(f"✅ Foto guardada con ID: {photo_id}")
            return {"success": True, "photo_id": photo_id}
    except Exception as e:
        print(f"❌ Error al guardar foto: {e}")
        raise

def get_photos_by_project(project_id: int, include_image_data: bool = False) -> list:
    """Obtiene todas las fotos de un proyecto."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
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
        print(f"❌ Error al obtener fotos del proyecto {project_id}: {e}")
        raise

def get_photo_by_id(photo_id: int) -> Optional[Dict[str, Any]]:
    """Obtiene una foto específica por ID (incluye IMAGE_DATA)."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM DISCONTINUITY_PHOTOS WHERE PHOTO_ID = %s"
            cursor.execute(query, (photo_id,))
            return cursor.fetchone()
    except Exception as e:
        print(f"❌ Error al obtener foto {photo_id}: {e}")
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
        print(f"❌ Error al eliminar foto {photo_id}: {e}")
        raise
