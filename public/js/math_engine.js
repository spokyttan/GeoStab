/**
 * GeoStab Math Engine (Client-Side)
 * Implementación de análisis cinemático para fallas planares y en cuña.
 */

const MathEngine = {
    /**
     * Convierte grados a radianes
     */
    toRadians: (degrees) => {
        return degrees * (Math.PI / 180);
    },

    /**
     * Convierte radianes a grados
     */
    toDegrees: (radians) => {
        return radians * (180 / Math.PI);
    },

    /**
     * Calcula la diferencia angular entre dos direcciones (0-360)
     * Retorna el valor absoluto de la diferencia menor (<= 180)
     */
    angleDifference: (angle1, angle2) => {
        let diff = Math.abs(angle1 - angle2);
        if (diff > 180) {
            diff = 360 - diff;
        }
        return diff;
    },

    /**
     * Análisis de Falla Planar
     * Criterios (Markland Test):
     * 1. La dirección de buzamiento del plano debe estar dentro de ±20° de la dirección de buzamiento del talud.
     * 2. El buzamiento del plano debe ser menor que el buzamiento del talud (ψ_f < ψ_s).
     * 3. El buzamiento del plano debe ser mayor que el ángulo de fricción (ψ_f > φ).
     */
    analyzePlanar: (talud, fractura, anguloFriccion) => {
        const cond1 = MathEngine.angleDifference(talud.rumbo, fractura.rumbo) <= 20;
        const cond2 = fractura.manteo < talud.manteo;
        const cond3 = fractura.manteo > anguloFriccion;

        const isRisk = cond1 && cond2 && cond3;

        let message = "Estable. No se cumplen condiciones cinemáticas.";
        if (isRisk) {
            message = "RIESGO CRÍTICO: Posible falla planar detectada.";
        } else if (cond1 && cond2) {
            message = "Precaución: Geometría favorable para deslizamiento, pero fricción suficiente.";
        }

        return {
            risk_detected: isRisk,
            message: message,
            details: {
                condition_orientation: cond1,
                condition_daylighting: cond2,
                condition_friction: cond3
            }
        };
    },

    /**
     * Análisis de Falla en Cuña (Simplificado)
     * Calcula la línea de intersección de dos planos y verifica si aflora en el talud.
     */
    analyzeWedge: (talud, f1, f2, anguloFriccion) => {
        // Conversión a notación de vector normal para cálculo de intersección
        // (Simplificación: Usaremos lógica geométrica directa para el plunge de intersección)

        // Cálculo aproximado del Plunge (inmersión) de la intersección
        // Esta es una simplificación. En una implementación completa se usaría álgebra vectorial.
        // Para este MVP, asumiremos riesgo si ambos planos son individualmente riesgosos o casi riesgosos.

        // Lógica de "Peor Caso" para MVP:
        // Si ambas fracturas tienen buzamientos > fricción y orientaciones convergentes.

        const f1_risk = f1.manteo > anguloFriccion;
        const f2_risk = f2.manteo > anguloFriccion;

        // Diferencia de orientación entre planos (deben formar una cuña, no ser paralelos)
        const diff_planes = MathEngine.angleDifference(f1.rumbo, f2.rumbo);
        const is_wedge_geometry = diff_planes > 20 && diff_planes < 160;

        const isRisk = f1_risk && f2_risk && is_wedge_geometry;

        let message = "Estable.";
        if (isRisk) {
            message = "RIESGO DE CUÑA: Intersección de planos crítica.";
        }

        return {
            risk_detected: isRisk,
            message: message,
            details: {
                f1_friction: f1_risk,
                f2_friction: f2_risk,
                wedge_geometry: is_wedge_geometry
            }
        };
    }
};

// Exportar para uso en navegador
window.MathEngine = MathEngine;
