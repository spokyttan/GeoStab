/**
 * GeoStab App Logic
 * Maneja la interacción con el DOM y la lógica de la aplicación.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('GeoStab App Initialized');

    // ============================================
    // SESSION MANAGEMENT (Anonymous UUID)
    // ============================================

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getSessionId() {
        let sessionId = localStorage.getItem('geostab_session_id');
        if (!sessionId) {
            sessionId = generateUUID();
            localStorage.setItem('geostab_session_id', sessionId);
            console.log('🆔 Nueva sesión creada:', sessionId);
        } else {
            console.log('🆔 Sesión existente:', sessionId);
        }
        return sessionId;
    }

    const SESSION_ID = getSessionId();

    // Referencias al DOM
    const btnAnalyze = document.querySelector('.btn-hero-primary'); // Botón "Ver Demo" -> Scroll
    const btnAnalyzeAction = document.querySelector('.btn-modern.primary'); // Botón Guardar (Simulado)
    const btnAnalyzeReal = document.querySelector('.demo-panel .btn-modern.primary'); // Botón Analizar (si existiera explícitamente)

    // En el HTML de Valeria, no hay un botón explícito de "Analizar" en el panel izquierdo, 
    // hay botones de "Guardar/Cargar". Vamos a convertir el botón "Guardar" en "Analizar" 
    // o añadir un listener al botón que añadiremos dinámicamente si falta.

    // Configurar botones de acción
    const actionButtons = document.querySelectorAll('.button-group-demo button');

    let currentProjectId = null;

    if (actionButtons.length >= 2) {
        const btnSave = actionButtons[0]; // 💾 Guardar
        const btnLoad = actionButtons[1]; // 📂 Cargar

        // Botón Guardar -> Ejecutar Análisis y Guardar
        btnSave.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("Botón Guardar presionado");
            await handleSave();
        });

        // Botón Cargar -> Abrir Modal
        btnLoad.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Botón Cargar presionado");
            openProjectModal();
        });
    } else {
        console.warn("No se encontraron los botones de acción en .button-group-demo");
    }

    // Modal Logic
    const modal = document.getElementById('project-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    async function openProjectModal() {
        if (modal) {
            modal.style.display = 'flex';
            await loadProjects();
        }
    }

    async function loadProjects() {
        const list = document.getElementById('project-list');
        list.innerHTML = '<li style="color: var(--text-muted);">Cargando...</li>';

        try {
            const res = await fetch(`${API_BASE_URL}/projects`, {
                headers: {
                    'X-Session-ID': SESSION_ID
                }
            });
            if (!res.ok) throw new Error('Error al cargar proyectos');
            const projects = await res.json();

            list.innerHTML = '';
            if (projects.length === 0) {
                list.innerHTML = '<li style="color: var(--text-muted);">No hay proyectos guardados.</li>';
                return;
            }

            projects.forEach(p => {
                const li = document.createElement('li');
                li.style.cssText = 'padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; display: flex; justify-content: space-between; align-items: center;';
                li.innerHTML = `
                    <span>${p.NAME}</span>
                    <span style="font-size: 12px; color: var(--text-muted);">${new Date(p.UPDATED_AT).toLocaleDateString()}</span>
                `;
                li.addEventListener('click', () => selectProject(p));

                // Hover effect
                li.addEventListener('mouseenter', () => li.style.background = 'rgba(255,255,255,0.05)');
                li.addEventListener('mouseleave', () => li.style.background = 'transparent');

                list.appendChild(li);
            });

        } catch (error) {
            console.error(error);
            list.innerHTML = '<li style="color: var(--danger);">Error al cargar proyectos.</li>';
        }
    }

    function selectProject(project) {
        currentProjectId = project.PROJECT_ID;
        const nameInput = document.querySelector('.input-modern[placeholder="Ej: Talud Ruta 5 Norte"]');
        if (nameInput) {
            nameInput.value = project.NAME;
        }

        modal.style.display = 'none';
        showToast(`Proyecto "${project.NAME}" cargado`, 'success');
    }

    async function handleSave() {
        const nameInput = document.querySelector('.input-modern[placeholder="Ej: Talud Ruta 5 Norte"]');
        const projectName = nameInput ? nameInput.value.trim() : "Sin Nombre";

        if (!projectName) {
            showToast("Por favor ingresa un nombre para el proyecto", "warning");
            return;
        }

        // Si no hay ID o el nombre cambió, crear/actualizar proyecto
        // Por simplicidad: Si no hay ID, creamos uno nuevo.
        if (!currentProjectId) {
            try {
                const res = await fetch(`${API_BASE_URL}/projects`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': SESSION_ID
                    },
                    body: JSON.stringify({ name: projectName, description: "Creado desde App" })
                });

                if (res.ok) {
                    const data = await res.json();
                    currentProjectId = data.project_id;
                    console.log("Nuevo proyecto creado:", currentProjectId);
                }
            } catch (e) {
                console.error("Error creando proyecto:", e);
                // Continuamos sin ID de proyecto si falla (modo offline o error)
            }
        }

        runAnalysis();
    }

    // Configuración API
    // Si estamos en local (file://), usar localhost:8080. Si estamos en web (http/https), usar /api (proxy)
    const API_BASE_URL = window.location.protocol === 'file:'
        ? "http://127.0.0.1:8080"
        : "/api";

    // --- SYNC MANAGER START ---
    const SyncManager = {
        QUEUE_KEY: 'geostab_sync_queue',

        getQueue() {
            return JSON.parse(localStorage.getItem(this.QUEUE_KEY) || '[]');
        },

        addToQueue(data) {
            const queue = this.getQueue();
            data.timestamp = new Date().toISOString();
            data.id = crypto.randomUUID(); // Unique ID for the item
            queue.push(data);
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
            this.updateUI();
        },

        removeFromQueue(id) {
            let queue = this.getQueue();
            queue = queue.filter(item => item.id !== id);
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
            this.updateUI();
        },

        async syncPendingData() {
            if (!navigator.onLine) return;

            const queue = this.getQueue();
            if (queue.length === 0) return;

            console.log(`Intentando sincronizar ${queue.length} elementos...`);
            updateSyncStatus('Syncing...', 'warning');

            for (const item of queue) {
                try {
                    console.log('Sincronizando item:', item);

                    // Preparar payloads para la API
                    const planarPayload = {
                        talud: item.talud,
                        fractura1: item.f1,
                        angulo_friccion: item.anguloFriccion,
                        site_id: 9999, // ID temporal por defecto
                        project_id: item.project_id || currentProjectId || null
                    };

                    const wedgePayload = {
                        talud: item.talud,
                        fractura1: item.f1,
                        fractura2: item.f2,
                        angulo_friccion: item.anguloFriccion,
                        site_id: 9999, // ID temporal por defecto
                        project_id: item.project_id || currentProjectId || null
                    };

                    // Enviar a la API (Planar)
                    const resPlanar = await fetch(`${API_BASE_URL}/analyze/planar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(planarPayload)
                    });

                    if (!resPlanar.ok) throw new Error('Error API Planar');

                    // Enviar a la API (Wedge) - Solo si hay datos de F2
                    if (item.f2 && (item.f2.rumbo !== 0 || item.f2.manteo !== 0)) {
                        const resWedge = await fetch(`${API_BASE_URL}/analyze/wedge`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(wedgePayload)
                        });
                        if (!resWedge.ok) throw new Error('Error API Wedge');
                    }

                    // Si todo sale bien, eliminar de la cola
                    this.removeFromQueue(item.id);
                    showToast('Datos sincronizados', 'success');

                } catch (error) {
                    console.error('Error al sincronizar item:', error);
                    // Se mantiene en la cola para reintentar luego
                }
            }

            this.updateUI();
        },

        updateUI() {
            const queue = this.getQueue();
            const statusBadge = document.getElementById('sync-status');
            const offlineIndicator = document.getElementById('offline-indicator');

            if (statusBadge) {
                if (queue.length > 0) {
                    statusBadge.textContent = `⏳ ${queue.length} Pendientes`;
                    statusBadge.className = 'badge warning';
                    statusBadge.style.display = 'inline-block';
                } else {
                    statusBadge.textContent = '✅ Sincronizado';
                    statusBadge.className = 'badge success';
                    statusBadge.style.display = 'none'; // Hide when synced
                }
            }
        }
    };

    // Network Event Listeners
    window.addEventListener('online', () => {
        console.log('Conexión restaurada. Sincronizando...');
        document.body.classList.remove('offline-mode');
        SyncManager.syncPendingData();
        showToast('Conexión restaurada', 'success');
    });

    window.addEventListener('offline', () => {
        console.log('Conexión perdida. Modo Offline.');
        document.body.classList.add('offline-mode');
        showToast('Modo Offline', 'warning');
    });

    // Initial Check
    if (!navigator.onLine) {
        document.body.classList.add('offline-mode');
    }
    SyncManager.updateUI();
    // --- SYNC MANAGER END ---

    // Helper for Toast Notifications
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Helper to update Sync Status Badge
    function updateSyncStatus(text, type) {
        const statusBadge = document.getElementById('sync-status');
        if (statusBadge) {
            statusBadge.textContent = text;
            statusBadge.className = `badge ${type}`;
            statusBadge.style.display = 'inline-block';
        }
    }

    // Modificar runAnalysis para guardar en cola
    function runAnalysis() {
        console.log('Ejecutando análisis...');

        // 1. Obtener valores del DOM
        const inputs = document.querySelectorAll('.input-modern');
        const taludManteo = parseFloat(inputs[1].value) || 0;
        const taludRumbo = parseFloat(inputs[2].value) || 0;
        const anguloFriccion = parseFloat(inputs[3].value) || 0;

        const discInputs = document.querySelectorAll('.disc-item input');
        const f1Manteo = parseFloat(discInputs[0].value) || 0;
        const f1Rumbo = parseFloat(discInputs[1].value) || 0;
        const f2Manteo = parseFloat(discInputs[2].value) || 0;
        const f2Rumbo = parseFloat(discInputs[3].value) || 0;

        // 2. Ejecutar Math Engine
        const talud = { rumbo: taludRumbo, manteo: taludManteo };
        const f1 = { rumbo: f1Rumbo, manteo: f1Manteo };
        const f2 = { rumbo: f2Rumbo, manteo: f2Manteo };

        // Análisis Planar (F1)
        const resultPlanar = window.MathEngine.analyzePlanar(talud, f1, anguloFriccion);

        // Análisis Cuña (F1 + F2)
        const resultWedge = window.MathEngine.analyzeWedge(talud, f1, f2, anguloFriccion);

        // 3. Mostrar Resultados
        updateUI(resultPlanar, resultWedge);

        // 4. Guardar Datos (Intento de Sync)
        const analysisData = {
            talud, f1, f2, anguloFriccion,
            resultPlanar, resultWedge,
            timestamp: new Date().toISOString()
        };

        if (navigator.onLine) {
            // Intentar enviar directamente a la API
            console.log("Intentando enviar a API...");

            // Usamos SyncManager para "encolar y enviar inmediatamente"
            // Esto simplifica la lógica: siempre encolamos, y si hay red, vaciamos la cola al instante.
            SyncManager.addToQueue(analysisData);
            SyncManager.syncPendingData();

        } else {
            SyncManager.addToQueue(analysisData);
            showToast('Guardado offline', 'info');
        }
    }

    function updateUI(planar, wedge) {
        const alertCard = document.querySelector('.alert-card');
        const alertTitle = alertCard.querySelector('h4');
        const alertText = alertCard.querySelector('p');
        const alertIcon = document.querySelector('.alert-icon-wrapper');

        const isRisk = planar.risk_detected || wedge.risk_detected;

        if (isRisk) {
            alertCard.className = 'alert-card warning';
            alertIcon.textContent = '⚠️';
            alertTitle.textContent = 'RIESGO DETECTADO';

            if (planar.risk_detected) {
                alertText.textContent = 'Falla Planar Crítica en Discontinuidad 1';
            } else {
                alertText.textContent = 'Falla en Cuña Crítica (F1 + F2)';
            }
        } else {
            alertCard.className = 'alert-card success'; // Necesitamos definir estilo success en CSS si no existe
            alertCard.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            alertCard.style.borderColor = '#10B981';

            alertIcon.textContent = '✅';
            alertTitle.textContent = 'ZONA SEGURA';
            alertText.textContent = 'No se detectaron riesgos cinemáticos.';
        }

        // Actualizar acordeón (simplificado)
        const fsText = document.querySelector('.danger-text');
        if (fsText) {
            fsText.textContent = isRisk ? "0.85 (Crítico)" : "1.45 (Estable)";
            fsText.style.color = isRisk ? "#EF4444" : "#10B981";
        }

        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = isRisk ? "⚠️ Inestable" : "✅ Estable";
            statusBadge.className = isRisk ? "status-badge danger" : "status-badge success";
            if (!isRisk) statusBadge.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
            if (!isRisk) statusBadge.style.color = "#10B981";
        }
    }

    // ============================================
    // DISCONTINUITY MANAGEMENT
    // ============================================

    let discontinuityCount = 2; // Empezamos con 2 (las 2 que vienen por defecto)

    // Botón "+ Añadir" para agregar discontinuidades
    const btnAddDisc = document.querySelector('.btn-add-modern');
    if (btnAddDisc) {
        btnAddDisc.addEventListener('click', () => {
            discontinuityCount++;
            const discList = document.querySelector('.discontinuity-list');

            const newDisc = document.createElement('div');
            newDisc.className = 'disc-item';
            newDisc.innerHTML = `
                <span class="disc-badge">${discontinuityCount}</span>
                <input type="number" placeholder="Buz." value="">
                <input type="number" placeholder="Dir." value="">
                <button class="btn-icon-modern camera">📷</button>
                <button class="btn-icon-modern delete">🗑️</button>
            `;

            discList.appendChild(newDisc);

            // Agregar event listener al nuevo botón de eliminar
            const newDeleteBtn = newDisc.querySelector('.btn-icon-modern.delete');
            newDeleteBtn.addEventListener('click', () => {
                newDisc.remove();
                reorderDiscontinuities();
            });

            console.log('Discontinuidad agregada');
        });
    }

    // Event listeners para los botones de eliminar existentes
    function attachDeleteListeners() {
        const deleteButtons = document.querySelectorAll('.btn-icon-modern.delete');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const discItem = e.target.closest('.disc-item');
                if (discItem) {
                    discItem.remove();
                    reorderDiscontinuities();
                }
            });
        });
    }

    // Función para reordenar los badges después de eliminar
    function reorderDiscontinuities() {
        const discItems = document.querySelectorAll('.disc-item');
        discItems.forEach((item, index) => {
            const badge = item.querySelector('.disc-badge');
            if (badge) {
                badge.textContent = index + 1;
            }
        });
        discontinuityCount = discItems.length;
    }

    // Inicializar event listeners para los botones existentes
    attachDeleteListeners();
});

// ============================================
// FIX: AGREGAR BOTONES DE ANÁLISIS
// ============================================

// Crear y agregar botones de análisis dinámicamente
function createAnalysisButtons() {
    const leftPanel = document.querySelector('.demo-panel.left-panel');
    if (!leftPanel) {
        console.warn('Left panel not found');
        return;
    }

    // Buscar después de discontinuity-list
    const discList = leftPanel.querySelector('.discontinuity-list');
    if (!discList) {
        console.warn('Discontinuity list not found');
        return;
    }

    // Crear sección de botones
    const analysisSection = document.createElement('div');
    analysisSection.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);';
    analysisSection.innerHTML = `
        <h4 style="color: var(--text); margin-bottom: 15px; font-size: 1rem;">Análisis Cinemático</h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-analyze-planar" class="btn-modern primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px;">
                🪨 Analizar Falla Planar
            </button>
            <button id="btn-analyze-wedge" class="btn-modern secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px;">
                🔺 Analizar Falla en Cuña
            </button>
        </div>
    `;

    // Insertar después de la lista de discontinuidades
    discList.parentNode.insertBefore(analysisSection, discList.nextSibling);
    console.log('✅ Botones de análisis creados');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getInputValues() {
    const inputs = document.querySelectorAll('.input-modern');
    const discInputs = document.querySelectorAll('.disc-item input');
    
    return {
        talud: {
            manteo: parseFloat(inputs[1].value) || 0,
            rumbo: parseFloat(inputs[2].value) || 0
        },
        f1: {
            manteo: parseFloat(discInputs[0].value) || 0,
            rumbo: parseFloat(discInputs[1].value) || 0
        },
        f2: {
            manteo: parseFloat(discInputs[2].value) || 0,
            rumbo: parseFloat(discInputs[3].value) || 0
        },
        anguloFriccion: parseFloat(inputs[3].value) || 30
    };
}

function validateInputs(talud, f1, anguloFriccion, f2 = null) {
    // Validar talud
    if (!talud || talud.manteo < 0 || talud.manteo > 90 || talud.rumbo < 0 || talud .rumbo > 360) {
        showToast('⚠️ Valores de talud inválidos', 'error');
        return false;
    }
    
    // Validar fractura 1
    if (!f1 || f1.manteo < 0 || f1.manteo > 90 || f1.rumbo < 0 || f1.rumbo > 360) {
        showToast('⚠️ Valores de discontinuidad 1 inválidos', 'error');
        return false;
    }
    
    // Validar fractura 2 si se proporciona
    if (f2 && (f2.manteo < 0 || f2.manteo > 90 || f2.rumbo < 0 || f2.rumbo > 360)) {
        showToast('⚠️ Valores de discontinuidad 2 inválidos', 'error');
        return false;
    }
    
    // Validar ángulo de fricción
    if (anguloFriccion < 0 || anguloFriccion > 90) {
        showToast('⚠️ Ángulo de fricción inválido (0-90°)', 'error');
        return false;
    }
    
    return true;
}

function showToast(message, type = 'info') {
    // Crear toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--primary)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

function analyzePlanarFailure() {
    console.log('🪨 Analizando Falla Planar...');
    
    const { talud, f1, anguloFriccion } = getInputValues();
    
    if (!validateInputs(talud, f1, anguloFriccion)) {
        return;
    }
    
    if (!window.MathEngine) {
        showToast('❌ Motor matemático no disponible', 'error');
        return;
    }
    
    const result = window.MathEngine.analyzePlanar(talud, f1, anguloFriccion);
    updatePlanarUI(result);
    showToast('✅ Análisis Planar completado', 'success');
    
    console.log('Resultado Planar:', result);
}

function analyzeWedgeFailure() {
    console.log('🔺 Analizando Falla en Cuña...');
    
    const { talud, f1, f2, anguloFriccion } = getInputValues();
    
    if (!validateInputs(talud, f1, anguloFriccion, f2)) {
        return;
    }
    
    if (!window.MathEngine) {
        showToast('❌ Motor matemático no disponible', 'error');
        return;
    }
    
    const result = window.MathEngine.analyzeWedge(talud, f1, f2, anguloFriccion);
    updateWedgeUI(result);
    showToast('✅ Análisis en Cuña completado', 'success');
    
    console.log('Resultado Wedge:', result);
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updatePlanarUI(result) {
    const alertCard = document.querySelector('.alert-card');
    const statusMessage = document.querySelector('.status-message');
    
    if (!alertCard || !statusMessage) return;
    
    if (result.risk_detected) {
        alertCard.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
        alertCard.style.borderColor = 'var(--danger)';
        statusMessage.innerHTML = `
            <strong style="color: var(--danger);">⚠️ RIESGO DETECTADO: Falla Planar</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || ''}</p>
            ${result.details ? `<p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
                Paralelismo: ${result.details.cond_strike ? '✓' : '✗'} | 
                Afloramiento: ${result.details.cond_daylight ? '✓' : '✗'} | 
                Fricción: ${result.details.cond_friction ? '✓' : '✗'}
            </p>` : ''}
        `;
    } else {
        alertCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
        alertCard.style.borderColor = 'var(--success)';
        statusMessage.innerHTML = `
            <strong style="color: var(--success);">✅ ESTABLE: Falla Planar</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">No se detectaron condiciones de riesgo</p>
        `;
    }
}

function updateWedgeUI(result) {
    const alertCard = document.querySelector('.alert-card');
    const statusMessage = document.querySelector('.status-message');
    
    if (!alertCard || !statusMessage) return;
    
    if (result.risk_detected) {
        alertCard.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
        alertCard.style.borderColor = 'var(--danger)';
        statusMessage.innerHTML = `
            <strong style="color: var(--danger);">⚠️ RIESGO DETECTADO: Falla en Cuña</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || ''}</p>
            ${result.details ? `<p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
                Plunge: ${result.details.plunge?.toFixed(1)}° | 
                Trend: ${result.details.trend?.toFixed(1)}° | 
                Afloramiento: ${result.details.cond_daylight ? '✓' : '✗'} | 
                Fricción: ${result.details.cond_friction ? '✓' : '✗'}
            </p>` : ''}
        `;
    } else {
        alertCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
        alertCard.style.borderColor = 'var(--success)';
        statusMessage.innerHTML = `
            <strong style="color: var(--success);">✅ ESTABLE: Falla en Cuña</strong>
            <p style="margin-top: 8px; font-size: 0.9rem;">${result.message || 'No se detectaron condiciones de riesgo'}</p>
        `;
    }
}

// ============================================
// ATTACH EVENT LISTENERS
// ============================================

function attachAnalysisListeners() {
    const btnPlanar = document.getElementById('btn-analyze-planar');
    const btnWedge = document.getElementById('btn-analyze-wedge');
    
    if (btnPlanar) {
        btnPlanar.addEventListener('click', (e) => {
            e.preventDefault();
            analyzePlanarFailure();
        });
        console.log('✅ Listener Planar attached');
    }
    
    if (btnWedge) {
        btnWedge.addEventListener('click', (e) => {
            e.preventDefault();
            analyzeWedgeFailure();
        });
        console.log('✅ Listener Wedge attached');
    }
}

// ============================================
// INITIALIZE
// ============================================

// Wait for DOM to be ready, then create buttons and attach listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            createAnalysisButtons();
            attachAnalysisListeners();
        }, 600); // Wait for other initializations
    });
} else {
    setTimeout(() => {
        createAnalysisButtons();
        attachAnalysisListeners();
    }, 600);
}
