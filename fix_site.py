import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Asegurar que podemos importar src
sys.path.append(str(Path(__file__).parent))

from src.db_utils.connection import get_db_connection

# Cargar variables de entorno
load_dotenv()

def fix_site():
    print("🚀 Reparando Sitio 9999...")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Crear Sitio por Defecto (ID 9999)
            site_id = 9999
            site_name = "Sitio Demo GeoStab"
            
            # Verificar si existe
            cursor.execute("SELECT SITE_ID FROM SITES WHERE SITE_ID = %s", (site_id,))
            if cursor.fetchone():
                print(f"✅ Sitio {site_id} ya existe.")
            else:
                print(f"➕ Creando Sitio {site_id}...")
                # Usar ST_GeomFromText para insertar un punto (Lat/Lon dummy)
                cursor.execute(
                    "INSERT INTO SITES (SITE_ID, SITE_NAME, LOCATION, CREATED_AT) VALUES (%s, %s, ST_GeomFromText('POINT(0 0)'), NOW())",
                    (site_id, site_name)
                )
                conn.commit()
                print(f"✅ Sitio {site_id} creado exitosamente.")
                
    except Exception as e:
        print(f"❌ Error al reparar sitio: {e}")

if __name__ == "__main__":
    fix_site()
