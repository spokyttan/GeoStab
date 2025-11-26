/**
 * GeoStab Math Engine (Client-Side)
 * Implementación de análisis cinemático para fallas planares y en cuña.
 * Portado de src/engine/math_engine.py (Python) para paridad exacta.
 */

const MathEngine = {
    DEG2RAD: Math.PI / 180.0,
    RAD2DEG: 180.0 / Math.PI,

    /**
     * Diferencia mínima absoluta entre dos ángulos en grados (0..180).
     */
    angleDiffDeg: (a, b) => {
        return Math.abs((a - b + 180) % 360 - 180);
    },

    /**
     * Convierte Dip Direction (alpha) y Dip (beta) a vector normal unitario.
     * Convención: X=Este, Y=Norte, Z=Arriba.
     */
    dipDirDipToNormal: (alphaDeg, betaDeg) => {
        const a = alphaDeg * MathEngine.DEG2RAD;
        const b = betaDeg * MathEngine.DEG2RAD;

        const nx = Math.sin(b) * Math.sin(a);
        const ny = Math.sin(b) * Math.cos(a);
        const nz = Math.cos(b);

        const norm = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (norm === 0) return [0, 0, 0]; // Should not happen with valid angles
        return [nx / norm, ny / norm, nz / norm];
    },

    /**
     * Calcula Plunge y Trend de un vector.
     */
    vectorPlungeTrend: (v) => {
        const [vx, vy, vz] = v;
        const horizMag = Math.hypot(vx, vy);

        // Plunge: ángulo con la horizontal (valor absoluto)
        const plungeRad = Math.atan2(Math.abs(-vz), horizMag);
        const plungeDeg = plungeRad * MathEngine.RAD2DEG;

        // Trend: azimut desde el Norte
        const trendRad = Math.atan2(vx, vy);
        let trendDeg = (trendRad * MathEngine.RAD2DEG) % 360;
        if (trendDeg < 0) trendDeg += 360;

        return { plunge: plungeDeg, trend: trendDeg };
    },

    /**
     * Análisis de Falla Planar
     */
    analyzePlanar: (talud, fractura, anguloFriccion, strikeTolDeg = 20.0) => {
        const a_p = talud.rumbo; // Dip Direction
        const b_p = talud.manteo; // Dip
        const a_f = fractura.rumbo;
        const b_f = fractura.manteo;

        // 1. Strike (Paralelismo)
        const diffDir = MathEngine.angleDiffDeg(a_p, a_f);
        const condStrike = diffDir <= strikeTolDeg;

        // 2. Daylighting (Afloramiento)
        // La fractura debe ser menor que el talud para salir a superficie
        const condDaylight = b_f < b_p;

        // 3. Fricción
        // La fractura debe ser más empinada que la fricción para deslizar
        const condFriction = b_f > anguloFriccion;

        const isRisk = condStrike && condDaylight && condFriction;

        let message = "Estable.";
        if (isRisk) {
            message = "RIESGO DETECTADO: Falla Planar.";
        }

        return {
            risk_detected: isRisk,
            message: message,
            details: {
                cond_strike: condStrike,
                cond_daylight: condDaylight,
                cond_friction: condFriction,
                diff_dir: diffDir
            }
        };
    },

    /**
     * Análisis de Falla en Cuña
     */
    analyzeWedge: (talud, f1, f2, anguloFriccion) => {
        // Normales
        const nA = MathEngine.dipDirDipToNormal(f1.rumbo, f1.manteo);
        const nB = MathEngine.dipDirDipToNormal(f2.rumbo, f2.manteo);
        const nTalud = MathEngine.dipDirDipToNormal(talud.rumbo, talud.manteo);

        // Producto Cruz para hallar línea de intersección (I = nA x nB)
        const Ix = nA[1] * nB[2] - nA[2] * nB[1];
        const Iy = nA[2] * nB[0] - nA[0] * nB[2];
        const Iz = nA[0] * nB[1] - nA[1] * nB[0];

        const I = [Ix, Iy, Iz];
        const INorm = Math.sqrt(Ix * Ix + Iy * Iy + Iz * Iz);

        if (INorm < 1e-8) {
            return {
                risk_detected: false,
                message: "Planos paralelos. No hay intersección.",
                valid_wedge: false
            };
        }

        const IUnit = [Ix / INorm, Iy / INorm, Iz / INorm];
        const { plunge: plungeDeg, trend: trendDeg } = MathEngine.vectorPlungeTrend(IUnit);

        // Obtener el Dip aparente del talud (referencia)
        // En Python: beta_p_deg = np.arccos(np.clip(nz, -1.0, 1.0)) * RAD2DEG
        // nz del talud es nTalud[2]
        const nz = nTalud[2];
        // clip
        const clippedNz = Math.min(Math.max(nz, -1.0), 1.0);
        const betaPDeg = Math.acos(clippedNz) * MathEngine.RAD2DEG;

        // 1. Daylighting (Afloramiento)
        const condDaylight = plungeDeg < betaPDeg;

        // 2. Fricción
        const condFriction = plungeDeg > anguloFriccion;

        const isRisk = condDaylight && condFriction;

        let message = "Estable.";
        if (isRisk) {
            message = "RIESGO DETECTADO: Falla en Cuña.";
        }

        return {
            risk_detected: isRisk,
            message: message,
            details: {
                cond_daylight: condDaylight,
                cond_friction: condFriction,
                plunge: plungeDeg,
                trend: trendDeg
            }
        };
    }
};

// Exportar para uso en navegador y Node.js (para tests)
if (typeof window !== 'undefined') {
    window.MathEngine = MathEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathEngine;
}
