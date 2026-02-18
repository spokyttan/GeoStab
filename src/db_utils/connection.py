import os
import logging
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtener URL de la base de datos
DATABASE_URL = os.environ.get('DATABASE_URL')

engine = None

if not DATABASE_URL:
    # Fail fast: Do not guess or construct URL. It must be provided.
    logger.error("DATABASE_URL environment variable is not set. Database functionality will fail.")
else:
    try:
        # pool_pre_ping=True checks connection aliveness before checkout
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Safe logging of host
        db_host = DATABASE_URL.split('@')[-1].split('/')[0] if '@' in DATABASE_URL else "unknown"
        logger.info(f"Database engine initialized for host: {db_host}")
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        engine = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db_connection():
    """
    Proporciona una conexión raw a la base de datos (DBAPI connection)
    compatible con el código legacy que usa cursores.
    """
    if not engine:
        logger.error("Attempted to get DB connection but engine is not initialized.")
        raise ValueError("Database engine is not initialized. Check DATABASE_URL.")

    # raw_connection() devuelve una conexión DBAPI (psycopg2 en este caso)
    conn = engine.raw_connection()
    try:
        yield conn
    except Exception as err:
        logger.error(f"Error en la conexión DBAPI: {err}")
        raise
    finally:
        conn.close()

def get_db():
    """
    Generador de sesión para FastAPI (Dependency Injection).
    """
    if not engine:
        logger.error("Attempted to get DB session but engine is not initialized.")
        raise ValueError("Database engine is not initialized. Check DATABASE_URL.")

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

    # Actualizar engine si DATABASE_URL recién apareció (solo para pruebas locales de este archivo)
    if not engine and os.environ.get('DATABASE_URL'):
        DATABASE_URL = os.environ.get('DATABASE_URL')
        print(f"Re-inicializando engine para testing...")
        engine = create_engine(DATABASE_URL)

    print("Iniciando prueba de conexión con PostgreSQL...")
    try:
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()
            print(f"Prueba exitosa. Versión de la base de datos: {db_version[0]}")
    except Exception as e:
        print(f"La prueba de conexión falló: {e}")
