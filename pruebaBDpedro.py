import mysql.connector

try:
    # Configura los detalles de tu conexión
    config = {
        'user': 'capitan',
        'password': 'C4pitan90@',
        'host': 'db1.inacapacademicdatacenter.com',
        'database': 'GeoStab',
        'port': 13043
    }
    print("Conectando a -> ", config)

    with mysql.connector.connect(**config) as conn:
        # Crea la conexión
        conn = mysql.connector.connect(**config)
        print("Conexión exitosa a MySQL")
        
        # Crea un objeto cursor para ejecutar consultas
        #cursor = conn.cursor()

        #for i in range(100):
        #    cursor.execute(f"Insert into tablaprueba values({i})")
        
        # Aquí puedes ejecutar tus consultas SQL
        # Ejemplo: cursor.execute("SELECT * FROM tu_tabla")
        
        # Para este ejemplo, solo mostramos que se realizó la conexión
        conn.commit()  # Asegura que los cambios se guarden en la base de datos
    
except mysql.connector.Error as err:
    print(f"Error al conectar a MySQL: {err}")

print("Conexión cerrada")