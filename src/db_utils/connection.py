import mysql.connector
import os
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    """
    Proporciona una conexión a la base de datos que se cierra automáticamente.
    Lee la configuración desde las variables de entorno.
    """
    conn = None
    try:
        config = {
            'user': os.environ.get('MYSQL_USER', 'capitan'),
            'password': os.environ.get('MYSQL_PASSWORD') or os.environ.get('MYSQL_PASSWORD_SECRET'),
            'host': os.environ.get('MYSQL_HOST') or os.environ.get('INACAP_DB_HOST'),
            'database': os.environ.get('MYSQL_DATABASE', 'GeoStab'),
            'port': 13043
        }
        conn = mysql.connector.connect(**config)
        print("Conexión a la base de datos establecida.")
        yield conn
    except mysql.connector.Error as err:
        print(f"Error al conectar a MySQL: {err}")
        raise
    finally:
        if conn and conn.is_connected():
            conn.close()
            print("Conexión a la base de datos cerrada.")


# Bloque para pruebas locales. Este código solo se ejecuta cuando corres 'python src/db_utils/connection.py'
if __name__ == '__main__':
    from dotenv import load_dotenv
    import os

    # Carga las variables desde el archivo .env en la raíz del proyecto
    # Asume que el .env está dos niveles arriba de este archivo (src/db_utils -> raíz)
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    # Renombra las variables del .env para que coincidan con las que espera el script
    os.environ['MYSQL_HOST'] = os.environ.get('INACAP_DB_HOST')
    os.environ['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD_SECRET')
    os.environ['MYSQL_USER'] = 'capitan'
    os.environ['MYSQL_DATABASE'] = 'GeoStab'

    print("Iniciando prueba de conexión...")
    try:
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION();")
            db_version = cursor.fetchone()
            print(f"Prueba exitosa. Versión de la base de datos: {db_version[0]}")
    except Exception as e:
        print(f"La prueba de conexión falló: {e}")