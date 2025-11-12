import mysql.connector

# Configuración (la misma que antes)
config = {
    'user': 'capitan',
    'password': 'C4pitan90@',
    'host': 'db1.inacapacademicdatacenter.com',
    'database': 'GeoStab',
    'port': 13043
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