import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Obtener URL de la base de datos
DATABASE_URL = os.environ.get('DATABASE_URL')

# Fallback para desarrollo local si no está definido DATABASE_URL
if not DATABASE_URL:
    # Intenta construirla desde variables antiguas o por defecto (asumiendo Postgres local)
    # Nota: Esto es solo un fallback. En producción (Render) debe existir DATABASE_URL.
    user = os.environ.get('POSTGRES_USER', 'postgres')
    password = os.environ.get('POSTGRES_PASSWORD', 'postgres')
    host = os.environ.get('POSTGRES_HOST', 'localhost')
    db = os.environ.get('POSTGRES_DB', 'geostab')
    port = os.environ.get('POSTGRES_PORT', '5432')
    DATABASE_URL = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"

# Crear el motor de SQLAlchemy
engine = None
try:
    if DATABASE_URL:
        engine = create_engine(DATABASE_URL)
        print(f"Engine creado para: {DATABASE_URL.split('@')[-1]}") # Log seguro (sin password)
    else:
        print("Advertencia: No se encontró DATABASE_URL. El engine no se inicializó.")
except Exception as e:
    print(f"Error al crear el engine de base de datos: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db_connection():
    """
    Proporciona una conexión raw a la base de datos (DBAPI connection)
    compatible con el código legacy que usa cursores.
    """
    if not engine:
        raise Exception("No se pudo inicializar el engine de base de datos. Verifique DATABASE_URL.")

    # raw_connection() devuelve una conexión DBAPI (psycopg2 en este caso)
    conn = engine.raw_connection()
    try:
        # print("Conexión a la base de datos establecida (SQLAlchemy raw).")
        yield conn
    except Exception as err:
        print(f"Error en la conexión: {err}")
        raise
    finally:
        conn.close()
        # print("Conexión a la base de datos cerrada.")

def get_db():
    """
    Generador de sesión para FastAPI (Dependency Injection).
    """
    if not engine:
        raise Exception("No se pudo inicializar el engine de base de datos. Verifique DATABASE_URL.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == '__main__':
    from dotenv import load_dotenv
    import sys

    # Carga variables desde .env
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    print(f"Cargando .env desde: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)

    # Actualizar engine si DATABASE_URL recién apareció
    if not engine:
        url = os.environ.get('DATABASE_URL')
        if url:
             print(f"Re-inicializando engine con: {url}")
             engine = create_engine(url)

    print("Iniciando prueba de conexión con PostgreSQL...")
    try:
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()
            print(f"Prueba exitosa. Versión de la base de datos: {db_version[0]}")
    except Exception as e:
        print(f"La prueba de conexión falló: {e}")
        # sys.exit(1) # No salir con error para no romper flujos de CI que solo verifiquen sintaxis
