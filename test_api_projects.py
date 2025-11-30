import requests
import time
import subprocess
import sys
import os

# Configuración
BASE_URL = "http://127.0.0.1:8005"
API_KEY = os.getenv("GEOSTAB_API_KEY", "test_key") # Asegúrate de que coincida con .env o default

def test_projects_flow():
    print("🚀 Iniciando pruebas de API de Proyectos...")
    
    headers = {"X-API-Key": API_KEY}
    
    # 1. Crear Proyecto
    print("\n1️⃣ Creando Proyecto...")
    payload = {
        "name": "Proyecto API Test",
        "description": "Creado desde test_api_projects.py"
    }
    response = requests.post(f"{BASE_URL}/projects", json=payload, headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code != 201:
        print("❌ Falló la creación del proyecto")
        sys.exit(1)
    
    project_id = response.json().get("project_id")
    
    # 2. Listar Proyectos
    print("\n2️⃣ Listando Proyectos...")
    response = requests.get(f"{BASE_URL}/projects", headers=headers)
    print(f"   Status: {response.status_code}")
    projects = response.json()
    print(f"   Proyectos encontrados: {len(projects)}")
    
    found = False
    for p in projects:
        if p['PROJECT_ID'] == project_id:
            found = True
            print(f"   ✅ Proyecto {project_id} encontrado en la lista")
            break
    
    if not found:
        print("❌ Proyecto no encontrado en la lista")
        sys.exit(1)
    
    # 3. Obtener Proyecto por ID
    print(f"\n3️⃣ Obteniendo Proyecto {project_id}...")
    response = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Data: {response.json()}")
    
    # 4. Actualizar Proyecto
    print(f"\n4️⃣ Actualizando Proyecto {project_id}...")
    update_payload = {"name": "Proyecto API Test UPDATED"}
    response = requests.put(f"{BASE_URL}/projects/{project_id}", json=update_payload, headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # 5. Eliminar Proyecto
    print(f"\n5️⃣ Eliminando Proyecto {project_id}...")
    response = requests.delete(f"{BASE_URL}/projects/{project_id}", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Verificar eliminación
    response = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    if response.status_code == 404:
        print("   ✅ Proyecto eliminado correctamente (404 Not Found)")
    else:
        print(f"   ❌ Error: El proyecto sigue existiendo (Status {response.status_code})")
        sys.exit(1)

if __name__ == "__main__":
    # Intentar conectar, si falla, asumir que el servidor no está corriendo
    try:
        requests.get(BASE_URL)
        test_projects_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar a la API en http://127.0.0.1:8000")
        print("   Asegúrate de iniciar el servidor con: uvicorn src.geostab_api.main:app --reload")
        sys.exit(1)
