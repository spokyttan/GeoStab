from fastapi.testclient import TestClient
from geostab_api.main import app
import os

client = TestClient(app)

def test_cors_blocks_evil_origin():
    """Verify that implementation BLOCKS unknown origins."""
    headers = {
        "Origin": "http://evil.com",
        "Access-Control-Request-Method": "GET"
    }
    response = client.options("/", headers=headers)

    # If blocked, CORS middleware usually doesn't add the headers,
    # or the browser blocks it.
    # Starlette CORSMiddleware simply doesn't add the Access-Control-Allow-Origin header
    # if the origin is not allowed.

    # Assert that the header is NOT present or does NOT match the origin
    allow_origin = response.headers.get("access-control-allow-origin")
    assert allow_origin != "http://evil.com", "Security Vulnerability: http://evil.com was allowed!"
    assert allow_origin != "*", "Security Vulnerability: Wildcard origin allowed!"

def test_cors_allows_local_ui():
    """Verify that implementation ALLOWS localhost:8501."""
    # We expect this to be allowed by default or config
    headers = {
        "Origin": "http://localhost:8501",
        "Access-Control-Request-Method": "GET"
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:8501"
