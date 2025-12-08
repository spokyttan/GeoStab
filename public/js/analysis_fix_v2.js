// ============================================
// ANÁLISIS CINEMÁTICO - VERSIÓN CORREGIDA V2
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 [V2] Inicializando botones de análisis...');

    setTimeout(() => {
        try {
            initAnalysisButtons();
        } catch (error) {
            console.error('❌ Error en initAnalysisButtons:', error);
        }
    }, 1200);
});

function initAnalysisButtons() {
    const leftPanel = document.querySelector('.demo-panel.left-panel');
    if (!leftPanel) {
        console.error('❌ Panel izquierdo no encontrado');
        return;
    }

    const discList = leftPanel.querySelector('.discontinuity-list');
    if (!discList) {
        console.error('❌ Lista de discontinuidades no encontrada');
        return;
    }

    // Crear botones solo si no existen ya
    if (document.getElementById('btn-analyze-planar-v3')) {
        console.log('⚠️ Botones ya existen, saltando creación');
        return;
    }

    const analysisHTML = `
        <div id="analysis-buttons-section" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <h4 style="color: var(--text); margin-bottom: 15px; font-size: 1rem;">Análisis Cinemático</h4>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="btn-analyze-planar-v3" class="btn-modern primary" style="padding: 12px;">
                    🪨 Analizar Falla Planar
                </button>
                <button id="btn-analyze-wedge-v3" class="btn-modern secondary" style="padding: 12px;">
                    🔺 Analizar Falla en Cuña
                </button>
            </div>
        </div>
    `;

    discList.insertAdjacentHTML('afterend', analysisHTML);
    console.log('✅ Botones V3 creados');

    // Event listeners
    const btnPlanar = document.getElementById('btn-analyze-planar-v3');
    const btnWedge = document.getElementById('btn-analyze-wedge-v3');

    if (btnPlanar) {
        btnPlanar.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🪨 [V3] Click en Analizar Planar');
            try {
                ejecutarAnalisisPlanarV2();
            } catch (error) {
                console.error('❌ Error en ejecutarAnalisisPlanarV2:', error);
                mostrarToastV2('❌ Error: ' + error.message, 'error');
            }
        });
        console.log('✅ Listener Planar V3 adjuntado');
    }

    if (btnWedge) {
        btnWedge.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔺 [V3] Click en Analizar Wedge');
            try {
                ejecutarAnalisisCunaV2();
            } catch (error) {
                console.error('❌ Error en ejecutarAnalisisCunaV2:', error);
                mostrarToastV2('❌ Error: ' + error.message, 'error');
            }
        });
        console.log('✅ Listener Wedge V3 adjuntado');
    }
}

function ejecutarAnalisisPlanarV2() {
    console.log('[PLANAR] Iniciando análisis...');

    // Obtener inputs de forma más segura
    const allInputs = document.querySelectorAll('.input-modern');
    console.log('[PLANAR] Total inputs encontrados:', allInputs.length);

    if (allInputs.length < 4) {
        throw new Error('No se encontraron suficientes inputs (esperados 4, encontrados ' + allInputs.length + ')');
    }

    const taludManteo = parseFloat(allInputs[1]?.value) || 0;
    const taludRumbo = parseFloat(allInputs[2]?.value) || 0;
    const anguloFriccion = parseFloat(allInputs[3]?.value) || 30;

    const allDiscInputs = document.querySelectorAll('.disc-item input');
    console.log('[PLANAR] Total disc inputs encontrados:', allDiscInputs.length);

    if (allDiscInputs.length < 2) {
        throw new Error('No se encontraron discontinuidades. Agrega al menos una.');
    }

    const f1Manteo = parseFloat(allDiscInputs[0]?.value) || 0;
    const f1Rumbo = parseFloat(allDiscInputs[1]?.value) || 0;

    console.log('[PLANAR] Valores:', {
        talud: { manteo: taludManteo, rumbo: taludRumbo },
        f1: { manteo: f1Manteo, rumbo: f1Rumbo },
        friccion: anguloFriccion
    });

    // Validación básica
    if (taludManteo === 0 && taludRumbo === 0) {
        mostrarToastV2('⚠️ Ingresa valores para el talud', 'error');
        return;
    }

    if (f1Manteo === 0 && f1Rumbo === 0) {
        mostrarToastV2('⚠️ Ingresa valores para la discontinuidad 1', 'error');
        return;
    }

    // Verificar que MathEngine existe
    if (!window.MathEngine) {
        throw new Error('Motor matemático no disponible (window.MathEngine no encontrado)');
    }

    if (typeof window.MathEngine.analyzePlanar !== 'function') {
        throw new Error('MathEngine.analyzePlanar no es una función');
    }

    // Ejecutar análisis
    const talud = { rumbo: taludRumbo, manteo: taludManteo };
    const f1 = { rumbo: f1Rumbo, manteo: f1Manteo };

    console.log('[PLANAR] Llamando a MathEngine.analyzePlanar...');
    const result = window.MathEngine.analyzePlanar(talud, f1, anguloFriccion);
    console.log('[PLANAR] Resultado:', result);

    // Actualizar UI
    actualizarUIPlanarV2(result);
    mostrarToastV2('✅ Análisis Planar completado', 'success');
}

function ejecutarAnalisisCunaV2() {
    console.log('[WEDGE] Iniciando análisis...');

    const allInputs = document.querySelectorAll('.input-modern');
    console.log('[WEDGE] Total inputs encontrados:', allInputs.length);

    if (allInputs.length < 4) {
        throw new Error('No se encontraron suficientes inputs');
    }

    const taludManteo = parseFloat(allInputs[1]?.value) || 0;
    const taludRumbo = parseFloat(allInputs[2]?.value) || 0;
    const anguloFriccion = parseFloat(allInputs[3]?.value) || 30;

    const allDiscInputs = document.querySelectorAll('.disc-item input');
    console.log('[WEDGE] Total disc inputs encontrados:', allDiscInputs.length);

    if (allDiscInputs.length < 4) {
        throw new Error('Se necesitan al menos 2 discontinuidades para análisis en cuña');
    }

    const f1Manteo = parseFloat(allDiscInputs[0]?.value) || 0;
    const f1Rumbo = parseFloat(allDiscInputs[1]?.value) || 0;
    const f2Manteo = parseFloat(allDiscInputs[2]?.value) || 0;
    const f2Rumbo = parseFloat(allDiscInputs[3]?.value) || 0;

    console.log('[WEDGE] Valores:', {
        talud: { manteo: taludManteo, rumbo: taludRumbo },
        f1: { manteo: f1Manteo, rumbo: f1Rumbo },
        f2: { manteo: f2Manteo, rumbo: f2Rumbo },
        friccion: anguloFriccion
    });

    if (f2Manteo === 0 && f2Rumbo === 0) {
        mostrarToastV2('⚠️ Ingresa valores para la discontinuidad 2', 'error');
        return;
    }

    if (!window.MathEngine || typeof window.MathEngine.analyzeWedge !== 'function') {
        throw new Error('Motor matemático no disponible');
    }

    const talud = { rumbo: taludRumbo, manteo: taludManteo };
    const f1 = { rumbo: f1Rumbo, manteo: f1Manteo };
    const f2 = { rumbo: f2Rumbo, manteo: f2Manteo };

    console.log('[WEDGE] Llamando a MathEngine.analyzeWedge...');
    const result = window.MathEngine.analyzeWedge(talud, f1, f2, anguloFriccion);
    console.log('[WEDGE] Resultado:', result);

    actualizarUICunaV2(result);
    mostrarToastV2('✅ Análisis en Cuña completado', 'success');
}

function actualizarUIPlanarV2(result) {
    console.log('[UI] Actualizando UI Planar...');

    const alertCard = document.querySelector('.alert-card');
    const statusMessage = document.querySelector('.status-message');

    if (!alertCard || !statusMessage) {
        console.warn('[UI] No se encontraron elementos de UI');
        return;
    }

    if (result.risk_detected) {
        alertCard.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
        alertCard.style.borderColor = '#EF4444';
        statusMessage.innerHTML = `
            <strong style="color: #EF4444;">⚠️ RIESGO DETECTADO: Falla Planar</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || 'Se detectaron condiciones de falla'}</p>
        `;
    } else {
        alertCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
        alertCard.style.borderColor = '#10B981';
        statusMessage.innerHTML = `
            <strong style="color: #10B981;">✅ ESTABLE: Falla Planar</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">No se detectaron condiciones de riesgo</p>
        `;
    }

    console.log('[UI] UI Planar actualizada');
}

function actualizarUICunaV2(result) {
    console.log('[UI] Actualizando UI Cuña...');

    const alertCard = document.querySelector('.alert-card');
    const statusMessage = document.querySelector('.status-message');

    if (!alertCard || !statusMessage) {
        console.warn('[UI] No se encontraron elementos de UI');
        return;
    }

    if (result.risk_detected) {
        alertCard.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
        alertCard.style.borderColor = '#EF4444';
        statusMessage.innerHTML = `
            <strong style="color: #EF4444;">⚠️ RIESGO DETECTADO: Falla en Cuña</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || 'Se detectaron condiciones de falla'}</p>
        `;
    } else {
        alertCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
        alertCard.style.borderColor = '#10B981';
        statusMessage.innerHTML = `
            <strong style="color: #10B981;">✅ ESTABLE: Falla en Cuña</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || 'No se detectaron condiciones de riesgo'}</p>
        `;
    }

    console.log('[UI] UI Cuña actualizada');
}

function mostrarToastV2(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    const bgColor = tipo === 'error' ? '#EF4444' : tipo === 'success' ? '#10B981' : '#FF6B35';

    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 99999;
        max-width: 300px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = mensaje;

    document.body.appendChild(toast);
    console.log('[TOAST]', tipo.toUpperCase(), ':', mensaje);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

console.log('✅ analysis_fix_v2.js cargado');
