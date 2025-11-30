import os
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector

# Cargar variables de entorno
load_dotenv()

def init_db_data():
    print("🚀 Inicializando datos base...")
    
    try:
        conn = mysql.connector.connect(
            host=os.getenv('INACAP_DB_HOST'),
            user='capitan',
            password=os.getenv('MYSQL_PASSWORD_SECRET'),
            database='GeoStab',
            port=3306
        )
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
            cursor.execute(
                "INSERT INTO SITES (SITE_ID, SITE_NAME, LOCATION, CREATED_AT) VALUES (%s, %s, %s, NOW())",
                (site_id, site_name, "Ubicación Demo")
            )
            conn.commit()
            print(f"✅ Sitio {site_id} creado exitosamente.")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error al inicializar datos: {e}")

if __name__ == "__main__":
    init_db_data()
