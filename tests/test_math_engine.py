import numpy as np
import pytest
from src.engine.math_engine import get_normal_vector, analyze_planar_fail # Importación limpia

#
# Pruebas para get_normal_vector (Sprint 1) 
#

def test_get_normal_vector_horizontal():
    """Prueba de "Golden Vector": Un plano horizontal (Manteo=0)."""
    # Rumbo=cualquiera, Manteo=0
    # Debe tener un vector normal apuntando estrictamente hacia arriba (Cénit: 0, 0, 1).
    rumbo, manteo = 135.0, 0.0
    normal_vec = get_normal_vector(rumbo, manteo)
    assert np.allclose(normal_vec, [0.0, 0.0, 1.0])

def test_get_normal_vector_vertical_norte():
    """Prueba de "Golden Vector": Un plano vertical (Manteo=90) con rumbo al Norte (000)."""
    # Debe tener un vector normal apuntando al Este (1, 0, 0).
    rumbo, manteo = 0.0, 90.0
    normal_vec = get_normal_vector(rumbo, manteo)
    assert np.allclose(normal_vec, [1.0, 0.0, 0.0])

def test_get_normal_vector_vertical_este():
    """Prueba de "Golden Vector": Un plano vertical (Manteo=90) con rumbo al Este (090)."""
    # Debe tener un vector normal apuntando al Sur (0, -1, 0).
    rumbo, manteo = 90.0, 90.0
    normal_vec = get_normal_vector(rumbo, manteo)
    assert np.allclose(normal_vec, [0.0, -1.0, 0.0])

def test_get_normal_vector_dipping_north():
    """Prueba de "Golden Vector": Plano con rumbo E-W (090) manteando 45 al Norte."""
    # (El vector normal debe apuntar al Sur y hacia arriba)
    rumbo, manteo = 90.0, 45.0
    normal_vec = get_normal_vector(rumbo, manteo)
    # cos(45) = 0.707
    assert np.allclose(normal_vec, [0.0, -0.707107, 0.707107])

#
# Pruebas para analyze_planar_fail (Sprint 2) 
#

@pytest.fixture
def setup_vectors():
    """Vectores precalculados para pruebas de análisis."""
    # Talud: Rumbo 135, Manteo 60 (Normal = [-0.61, -0.35, 0.70])
    talud_normal = get_normal_vector(135, 60) 
    # Fractura (Riesgo): Rumbo 135, Manteo 45 (Manteo < Talud, > Fricción)
    fractura_riesgo = get_normal_vector(135, 45)
    # Fractura (Segura): Rumbo 135, Manteo 70 (Manteo > Talud)
    fractura_segura_dip = get_normal_vector(135, 70)
    return talud_normal, fractura_riesgo, fractura_segura_dip

def test_planar_fail_riesgo_detectado(setup_vectors):
    """Prueba la lógica de riesgo cinemático."""
    talud_normal, fractura_riesgo, _ = setup_vectors
    angulo_friccion = 30.0 # Manteo 45 > Fricción 30
    
    # Condición de riesgo: ManteoTalud (60) > ManteoFractura (45) > AnguloFriccion (30)
    is_risk = analyze_planar_fail(talud_normal, fractura_riesgo, angulo_friccion)
    assert is_risk == True

def test_planar_fail_sin_riesgo_manteo_seguro(setup_vectors):
    """Prueba sin riesgo: La fractura mantea más que el talud."""
    talud_normal, _, fractura_segura_dip = setup_vectors
    angulo_friccion = 30.0
    
    # Condición segura: ManteoTalud (60) < ManteoFractura (70)
    is_risk = analyze_planar_fail(talud_normal, fractura_segura_dip, angulo_friccion)
    assert is_risk == False