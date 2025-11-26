from typing import Tuple, Dict
import numpy as np

DEG2RAD = np.pi / 180.0
RAD2DEG = 180.0 / np.pi


def _angle_diff_deg(a: float, b: float) -> float:
    """Diferencia mínima absoluta entre dos ángulos en grados (0..180)."""
    d = abs((a - b + 180) % 360 - 180)
    return d


def dipdir_dip_to_normal(alpha_deg: float, beta_deg: float) -> np.ndarray:
    """
    Convierte Dip Direction (alpha) y Dip (beta) a vector normal unitario.
    Convención: X=Este, Y=Norte, Z=Arriba.
    """
    a = alpha_deg * DEG2RAD
    b = beta_deg * DEG2RAD

    nx = np.sin(b) * np.sin(a)
    ny = np.sin(b) * np.cos(a)
    nz = np.cos(b)

    n = np.array([nx, ny, nz], dtype=float)
    norm = np.linalg.norm(n)
    if norm == 0:
        raise ValueError("Vector normal nulo (ver valores de entrada)")
    return n / norm


def _vector_plunge_trend(v: np.ndarray) -> Tuple[float, float]:
    """Calcula Plunge y Trend de un vector."""
    vx, vy, vz = v
    horiz_mag = np.hypot(vx, vy)
    
    # Plunge: ángulo con la horizontal (valor absoluto)
    plunge_rad = np.arctan2(abs(-vz), horiz_mag) 
    plunge_deg = plunge_rad * RAD2DEG

    # Trend: azimut desde el Norte
    trend_rad = np.arctan2(vx, vy)
    trend_deg = (trend_rad * RAD2DEG) % 360
    return plunge_deg, trend_deg


def planar_failure(talud: Dict[str, float], fractura: Dict[str, float], phi_deg: float, strike_tol_deg: float = 20.0) -> Dict:
    """
    Evalúa Falla Planar.
    Lógica Física: El plano debe ser menos inclinado que el talud para aflorar (b_f < b_p).
    """
    a_p = talud['alpha']
    b_p = talud['beta']
    a_f = fractura['alpha']
    b_f = fractura['beta']

    # Normales
    n_p = dipdir_dip_to_normal(a_p, b_p)
    n_f = dipdir_dip_to_normal(a_f, b_f)

    # 1. Strike (Paralelismo)
    diff_dir = _angle_diff_deg(a_p, a_f)
    cond_strike = diff_dir <= strike_tol_deg

    # 2. Daylighting (Afloramiento)
    # Correcto: La fractura debe ser menor que el talud para salir a superficie
    cond_daylight = b_f < b_p

    # 3. Fricción
    # Correcto: La fractura debe ser más empinada que la fricción para deslizar
    cond_friction = b_f > phi_deg

    # Riesgo GLOBAL: Deben cumplirse las 3
    risk_detected = cond_strike and cond_daylight and cond_friction

    explanation = (
        f"1. Paralelismo: Dif={diff_dir:.1f}° (Tol {strike_tol_deg}°) -> {cond_strike}\n"
        f"2. Afloramiento: Fractura ({b_f}°) < Talud ({b_p}°) -> {cond_daylight}\n"
        f"3. Fricción: Fractura ({b_f}°) > Fricción ({phi_deg}°) -> {cond_friction}\n"
        f"RESULTADO: {'RIESGO DETECTADO' if risk_detected else 'ESTABLE'}"
    )

    return {
        'risk_detected': risk_detected,
        'cond_strike': cond_strike,
        'cond_daylight': cond_daylight,
        'cond_friction': cond_friction,
        'n_talud': n_p,
        'n_fractura': n_f,
        'explanation': explanation,
    }


def wedge_failure(nA: np.ndarray, nB: np.ndarray, talud_normal: np.ndarray, phi_deg: float) -> Dict:
    """
    #Evalúa Falla en Cuña.
    
    """
    # Asegurar vectores unitarios
    nA_u = nA / np.linalg.norm(nA)
    nB_u = nB / np.linalg.norm(nB)

    # Producto Cruz para hallar línea de intersección
    I = np.cross(nA_u, nB_u)
    I_norm = np.linalg.norm(I)
    
    # Validación de intersección válida
    if I_norm < 1e-8:
        return {
            'valid_wedge': False,
            'risk_detected': False,
            'reason': 'Planos paralelos. No hay intersección.'
        }

    I_unit = I / I_norm
    plunge_deg, trend_deg = _vector_plunge_trend(I_unit)

    # Obtener el Dip aparente del talud (referencia)
    nz = talud_normal[2]
    beta_p_deg = np.arccos(np.clip(nz, -1.0, 1.0)) * RAD2DEG

    # 1. Daylighting (Afloramiento)
    # La línea de intersección debe tener un plunge menor que el dip del talud
    cond_daylight = plunge_deg < beta_p_deg

    # 2. Fricción
    # El plunge debe ser mayor que el ángulo de fricción
    cond_friction = plunge_deg > phi_deg

    risk_detected = cond_daylight and cond_friction

    explanation = (
        f"1. Afloramiento: Plunge ({plunge_deg:.1f}°) < Talud ({beta_p_deg:.1f}°) -> {cond_daylight}\n"
        f"2. Fricción: Plunge ({plunge_deg:.1f}°) > Fricción ({phi_deg}°) -> {cond_friction}\n"
        f"RESULTADO: {'RIESGO DETECTADO' if risk_detected else 'ESTABLE'}"
    )

    return {
        'risk_detected': risk_detected,
        'cond_daylight': cond_daylight,
        'cond_friction': cond_friction,
        'plunge': plunge_deg,
        'trend': trend_deg,
        'explanation': explanation
    }