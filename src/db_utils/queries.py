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
    planar_risk: bool
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
                    MEASURED_AT
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
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
                datetime.now()
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
    wedge_risk: bool
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
                    MEASURED_AT
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
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
                datetime.now()
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
    # Este archivo está dos niveles arriba: src/db_utils -> src -> raíz
    project_root = Path(__file__).parent.parent.parent
    dotenv_path = project_root / '.env'
    
    print(f"📂 Buscando .env en: {dotenv_path}")
    
    if not dotenv_path.exists():
        print(f"❌ ERROR: No se encontró .env en {dotenv_path}")
        print("   Crea el archivo .env en la raíz del proyecto con:")
        print("   INACAP_DB_HOST=db1.inacapacademicdatacenter.com")
        print("   MYSQL_PASSWORD_SECRET=tu_password")
        exit(1)
    
    # Cargar variables de entorno
    load_dotenv(dotenv_path=dotenv_path)
    
    # Verificar que se cargaron
    if not os.getenv('INACAP_DB_HOST'):
        print("❌ ERROR: INACAP_DB_HOST no está definido en .env")
        exit(1)
    
    # Configurar variables para connection.py
    os.environ['MYSQL_HOST'] = os.getenv('INACAP_DB_HOST')
    os.environ['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD_SECRET')
    os.environ['MYSQL_USER'] = 'capitan'
    os.environ['MYSQL_DATABASE'] = 'GeoStab'
    
    print(f"✅ Variables cargadas desde {dotenv_path}")
    
    print("=" * 60)
    print("🧪 PRUEBAS DE QUERIES")
    print("=" * 60)
    
    # Crear un objeto mock para simular request_data
    class MockMeasurement:
        def __init__(self, rumbo, manteo):
            self.rumbo = rumbo
            self.manteo = manteo
    
    class MockPlanarRequest:
        def __init__(self):
            self.talud = MockMeasurement(135, 60)
            self.fractura1 = MockMeasurement(135, 45)
            self.angulo_friccion = 30.0
    
    class MockWedgeRequest:
        def __init__(self):
            self.talud = MockMeasurement(210, 70)
            self.fractura1 = MockMeasurement(180, 60)
            self.fractura2 = MockMeasurement(240, 65)
            self.angulo_friccion = 35.0
    
    try:
        # 0️⃣ Preparación: Crear sitio de prueba
        print("\n0️⃣ Creando sitio de prueba...")
        test_site_id = 9999
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Limpiar si existe
            cursor.execute("DELETE FROM SITES WHERE SITE_ID = %s", (test_site_id,))
            conn.commit()
            
            # Crear sitio
            cursor.execute(
                "INSERT INTO SITES (SITE_ID, SITE_NAME) VALUES (%s, %s)",
                (test_site_id, "Sitio de Prueba Auto")
            )
            conn.commit()
            print(f"   Sitio creado con ID: {test_site_id}")

        # Prueba 1: Guardar medición planar
        print("\n1️⃣ Probando save_planar_measurement...")
        planar_req = MockPlanarRequest()
        result_planar = save_planar_measurement(site_id=test_site_id, request_data=planar_req, planar_risk=True)
        print(f"   Resultado: {result_planar}")
        
        # Prueba 2: Guardar medición en cuña
        print("\n2️⃣ Probando save_wedge_measurement...")
        wedge_req = MockWedgeRequest()
        result_wedge = save_wedge_measurement(site_id=test_site_id, request_data=wedge_req, wedge_risk=False)
        print(f"   Resultado: {result_wedge}")
        
        # Prueba 3: Obtener mediciones del sitio
        print("\n3️⃣ Probando get_site_measurements...")
        measurements = get_site_measurements(site_id=test_site_id, limit=5)
        print(f"   Se obtuvieron {len(measurements)} mediciones")
        
        # Prueba 4: Obtener resumen de riesgos
        print("\n4️⃣ Probando get_risk_summary...")
        summary = get_risk_summary(site_id=test_site_id)
        print(f"   Resumen: {summary}")
        
        # Prueba 5: Eliminar mediciones (Limpieza)
        print("\n5️⃣ Probando delete_measurement (Limpieza)...")
        if result_planar['success']:
            delete_measurement(result_planar['measurement_id'])
        if result_wedge['success']:
            delete_measurement(result_wedge['measurement_id'])
            
        # Limpieza final del sitio
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
        # Intentar limpiar en caso de error
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM SITES WHERE SITE_ID = 9999")
                conn.commit()
        except:
            pass