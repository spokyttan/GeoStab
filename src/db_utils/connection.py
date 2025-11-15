import mysql.connector
import os # Importar el módulo 'os' para acceder a las variables de entorno
from dotenv import load_dotenv # Importar load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()
# Cargar la configuración desde variables de entorno para mayor seguridad y flexibilidad.
# Estos valores se pueden definir en un archivo .env o directamente en el sistema.
config = {
    'user': os.getenv('DB_USER', 'capitan'),
    'password': os.getenv('DB_PASSWORD'), # El password no debería tener un valor por defecto
    'host': os.getenv('DB_HOST', 'db1.inacapacademicdatacenter.com'),
    'database': os.getenv('DB_NAME', 'GeoStab'),
    'port': int(os.getenv('DB_PORT', 13043)) # Convertir el puerto a entero
}


# --- Comandos SQL para ELIMINAR (DROP) ---

# Usamos "IF EXISTS" para que no dé error si la tabla ya no existe.

# 1. Primero borramos MEASUREMENTS porque depende de SITES
sql_drop_measurements = "DROP TABLE IF EXISTS MEASUREMENTS;"

# 2. Luego borramos SITES
sql_drop_sites = "DROP TABLE IF EXISTS SITES;"

try:
    # Usamos 'with' para manejar la conexión y el cursor
    with mysql.connector.connect(**config) as conn:
        print("Conexión exitosa a MySQL")
        cursor = conn.cursor()
        
        print("Iniciando eliminación...")
        
        # --- Ejecución en orden inverso a la creación ---

        # 1. Eliminar MEASUREMENTS (Debe ser primero por la FK)
        try:
            print("Eliminando tabla MEASUREMENTS...")
            cursor.execute(sql_drop_measurements)
            print("-> Tabla MEASUREMENTS eliminada.")
        except mysql.connector.Error as err:
            print(f"Error/Advertencia al eliminar MEASUREMENTS: {err}")

        # 2. Eliminar SITES
        try:
            print("Eliminando tabla SITES...")
            cursor.execute(sql_drop_sites)
            print("-> Tabla SITES eliminada.")
        except mysql.connector.Error as err:
            print(f"Error/Advertencia al eliminar SITES: {err}")

        # Confirmamos los cambios en la base de datos
        conn.commit()
        print("\n¡Tablas eliminadas correctamente!")

except mysql.connector.Error as err:
    print(f"Error crítico de conexión: {err}")

print("Conexión cerrada")