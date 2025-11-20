import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    'user': 'capitan',
    'password': os.getenv('MYSQL_PASSWORD_SECRET'),
    'host': os.getenv('INACAP_DB_HOST'),
    'database': 'GeoStab',
    'port': 13043
}

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    site_id = 8888
    cursor.execute("DELETE FROM SITES WHERE SITE_ID = %s", (site_id,))
    conn.commit()
    
    cursor.execute("INSERT INTO SITES (SITE_ID, SITE_NAME) VALUES (%s, %s)", (site_id, "API Test Site"))
    conn.commit()
    
    print(f"Created test site with ID {site_id}")
    conn.close()

except Exception as e:
    print(f"Error: {e}")
