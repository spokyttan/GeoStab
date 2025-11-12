from fastapi.testclient import TestClient
from geostab_api.main import app # Importa la app de Nattan
client = TestClient(app)

def test_analyze_planar_endpoint():
    """Prueba el endpoint /analyze/planar de Nattan."""
    # Simula los datos de la UI de Valeria 
    test_data = {
        "talud": {"rumbo": 135, "manteo": 60},
        "fractura1": {"rumbo": 135, "manteo": 45},
        "angulo_friccion": 30.0,
        "site_id": 1
    }
    
    # Simula un 'requests.post'
    response = client.post("/analyze/planar", json=test_data)
    
    assert response.status_code == 200
    # Comprueba la respuesta que recibirá Valeria 
    assert response.json()["risk_detected"] == True