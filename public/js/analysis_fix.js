// ============================================
// ANÁLISIS CINEMÁTICO - VERSIÓN CORREGIDA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando botones de análisis...');

    // Esperar a que todo esté cargado
    setTimeout(() => {
        // Crear botones
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

        // Crear sección de análisis
        const analysisHTML = `
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h4 style="color: var(--text); margin-bottom: 15px; font-size: 1rem;">Análisis Cinemático</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="btn-analyze-planar-v2" class="btn-modern primary" style="padding: 12px;">
                        🪨 Analizar Falla Planar
                    </button>
                    <button id="btn-analyze-wedge-v2" class="btn-modern secondary" style="padding: 12px;">
                        🔺 Analizar Falla en Cuña
                    </button>
                </div>
            </div>
        `;

        // Insertar después de la lista de discontinuidades
        discList.insertAdjacentHTML('afterend', analysisHTML);
        console.log('✅ Botones creados');

        // Adjuntar event listeners
        const btnPlanar = document.getElementById('btn-analyze-planar-v2');
        const btnWedge = document.getElementById('btn-analyze-wedge-v2');

        if (btnPlanar) {
            btnPlanar.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('🪨 Click en Analizar Planar');
                ejecutarAnalisisPlanar();
            });
            console.log('✅ Listener Planar adjuntado');
        }

        if (btnWedge) {
            btnWedge.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('🔺 Click en Analizar Wedge');
                ejecutarAnalisisCuna();
            });
            console.log('✅ Listener Wedge adjuntado');
        }
    }, 1000);
});

function ejecutarAnalisisPlanar() {
    console.log('Ejecutando análisis planar...');

    // Obtener valores
    const inputs = document.querySelectorAll('.input-modern');
    const discInputs = document.querySelectorAll('.disc-item input');

    const taludManteo = parseFloat(inputs[1]?.value) || 0;
    const taludRumbo = parseFloat(inputs[2]?.value) || 0;
    const anguloFriccion = parseFloat(inputs[3]?.value) || 30;

    const f1Manteo = parseFloat(discInputs[0]?.value) || 0;
    const f1Rumbo = parseFloat(discInputs[1]?.value) || 0;

    console.log('Valores:', { taludManteo, taludRumbo, anguloFriccion, f1Manteo, f1Rumbo });

    // Validar
    if (taludManteo === 0 && taludRumbo === 0 && f1Manteo === 0 && f1Rumbo === 0) {
        mostrarToast('⚠️ Por favor ingresa valores diferentes de 0', 'error');
        return;
    }

    // Crear objetos
    const talud = { rumbo: taludRumbo, manteo: taludManteo };
    const f1 = { rumbo: f1Rumbo, manteo: f1Manteo };

    // Ejecutar análisis
    if (!window.MathEngine) {
        mostrarToast('❌ Motor matemático no disponible', 'error');
        return;
    }

    const result = window.MathEngine.analyzePlanar(talud, f1, anguloFriccion);
    console.log('Resultado:', result);

    // Mostrar resultado
    actualizarUIPlanar(result);
    mostrarToast('✅ Análisis Planar completado', 'success');
}

function ejecutarAnalisisCuna() {
    console.log('Ejecutando análisis en cuña...');

    // Obtener valores
    const inputs = document.querySelectorAll('.input-modern');
    const discInputs = document.querySelectorAll('.disc-item input');

    const taludManteo = parseFloat(inputs[1]?.value) || 0;
    const taludRumbo = parseFloat(inputs[2]?.value) || 0;
    const anguloFriccion = parseFloat(inputs[3]?.value) || 30;

    const f1Manteo = parseFloat(discInputs[0]?.value) || 0;
    const f1Rumbo = parseFloat(discInputs[1]?.value) || 0;
    const f2Manteo = parseFloat(discInputs[2]?.value) || 0;
    const f2Rumbo = parseFloat(discInputs[3]?.value) || 0;

    console.log('Valores:', { taludManteo, taludRumbo, anguloFriccion, f1Manteo, f1Rumbo, f2Manteo, f2Rumbo });

    // Validar
    if (taludManteo === 0 && taludRumbo === 0 && f1Manteo === 0 && f1Rumbo === 0 && f2Manteo === 0 && f2Rumbo === 0) {
        mostrarToast('⚠️ Por favor ingresa valores diferentes de 0', 'error');
        return;
    }

    // Crear objetos
    const talud = { rumbo: taludRumbo, manteo: taludManteo };
    const f1 = { rumbo: f1Rumbo, manteo: f1Manteo };
    const f2 = { rumbo: f2Rumbo, manteo: f2Manteo };

    // Ejecutar análisis
    if (!window.MathEngine) {
        mostrarToast('❌ Motor matemático no disponible', 'error');
        return;
    }

    const result = window.MathEngine.analyzeWedge(talud, f1, f2, anguloFriccion);
    console.log('Resultado:', result);

    // Mostrar resultado
    actualizarUICuna(result);
    mostrarToast('✅ Análisis en Cuña completado', 'success');
}

function actualizarUIPlanar(result) {
    const alertCard = document.querySelector('.alert-card');
    const statusMessage = document.querySelector('.status-message');

    if (!alertCard || !statusMessage) {
        console.warn('No se encontraron elementos de UI para actualizar');
        return;
    }

    if (result.risk_detected) {
        alertCard.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
        alertCard.style.borderColor = '#EF4444';
        statusMessage.innerHTML = `
            <strong style="color: #EF4444;">⚠️ RIESGO DETECTADO: Falla Planar</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || ''}</p>
        `;
    } else {
        alertCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
        alertCard.style.borderColor = '#10B981';
        statusMessage.innerHTML = `
            <strong style="color: #10B981;">✅ ESTABLE: Falla Planar</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">No se detectaron condiciones de riesgo</p>
        `;
    }
}

function actualizarUICuna(result) {
    const alertCard = document.querySelector('.alert-card');
    const statusMessage = document.querySelector('.status-message');

    if (!alertCard || !statusMessage) {
        console.warn('No se encontraron elementos de UI para actualizar');
        return;
    }

    if (result.risk_detected) {
        alertCard.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
        alertCard.style.borderColor = '#EF4444';
        statusMessage.innerHTML = `
            <strong style="color: #EF4444;">⚠️ RIESGO DETECTADO: Falla en Cuña</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || ''}</p>
        `;
    } else {
        alertCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
        alertCard.style.borderColor = '#10B981';
        statusMessage.innerHTML = `
            <strong style="color: #10B981;">✅ ESTABLE: Falla en Cuña</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || 'No se detectaron condiciones de riesgo'}</p>
        `;
    }
}

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    const bgColor = tipo === 'error' ? '#EF4444' : tipo === 'success' ? '#10B981' : '#FF6B35';

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        max-width: 300px;
        font-weight: 500;
    `;
    toast.textContent = mensaje;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
