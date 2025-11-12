# (En src/engine/math_engine.py)
import numpy as np

def get_normal_vector(rumbo: float, manteo: float) -> np.ndarray:
    """
    Convierte los ángulos geológicos (Rumbo y Manteo) en un vector normal 3D.
    TAREA SPRINT 1 (Francisca / Nattan)
    """
    # Lógica de placeholder - ¡ESTO FALLARÁ LAS PRUEBAS (lo cual es bueno)!
    print("ADVERTENCIA: get_normal_vector() no está implementado.")
    return np.array([0.0, 0.0, 0.0]) # Devuelve un vector incorrecto

def analyze_planar_fail(talud_normal: np.ndarray,
                        fractura_normal: np.ndarray,
                        angulo_friccion: float) -> bool:
    """
    Realiza un análisis cinemático simplificado para falla planar.
    TAREA SPRINT 2 (Francisca) 
    """
    print("ADVERTENCIA: analyze_planar_fail() no está implementado.")
    return False

def analyze_wedge_fail(talud_normal: np.ndarray,
                       f1_normal: np.ndarray,
                       f2_normal: np.ndarray,
                       angulo_friccion: float) -> bool:
    """
    Realiza un análisis cinemático simplificado para falla en cuña.
    TAREA SPRINT 2 (Francisca) 
    """
    print("ADVERTENCIA: analyze_wedge_fail() no está implementado.")
    return False