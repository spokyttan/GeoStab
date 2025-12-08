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

// ========================================
// AUTO-ANÁLISIS EN CAMBIO DE INPUTS
// ========================================

/**
 * Debounce helper - evita ejecutar demasiadas veces
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Obtiene datos de los inputs - TODAS las discontinuidades
 */
function getAnalysisData() {
    const inputs = document.querySelectorAll('.input-modern');
    const discItems = document.querySelectorAll('.disc-item');

    // Obtener todas las discontinuidades
    const discontinuidades = [];
    discItems.forEach((item, index) => {
        const itemInputs = item.querySelectorAll('input');
        const manteo = parseFloat(itemInputs[0]?.value) || 0;
        const rumbo = parseFloat(itemInputs[1]?.value) || 0;

        // Solo agregar si tiene valores
        if (manteo > 0 || rumbo > 0) {
            discontinuidades.push({
                id: index + 1,
                manteo: manteo,
                rumbo: rumbo
            });
        }
    });

    return {
        talud: {
            manteo: parseFloat(inputs[1]?.value) || 0,
            rumbo: parseFloat(inputs[2]?.value) || 0
        },
        friccion: parseFloat(inputs[3]?.value) || 30,
        discontinuidades: discontinuidades
    };
}

/**
 * Actualiza la sección de resultados para falla planar
 */
function updatePlanarResult(result, data) {
    // Actualizar valores en la tabla
    const buzEl = document.getElementById('planar-buz');
    const dirEl = document.getElementById('planar-dir');
    const statusEl = document.getElementById('planar-status');
    const badgeEl = document.getElementById('planar-badge');

    if (buzEl && data) buzEl.textContent = data.f1.manteo;
    if (dirEl && data) dirEl.textContent = data.f1.rumbo;

    if (result.risk_detected) {
        if (statusEl) statusEl.innerHTML = '<span class="danger-text">⚠️ Inestable</span>';
        if (badgeEl) {
            badgeEl.textContent = '⚠️ Inestable - Acción Requerida';
            badgeEl.className = 'status-badge danger';
        }
    } else {
        if (statusEl) statusEl.innerHTML = '<span class="success-text">✅ Estable</span>';
        if (badgeEl) {
            badgeEl.textContent = '✅ Estable';
            badgeEl.className = 'status-badge success';
        }
    }

    // Actualizar badge del header
    const headerBadge = document.querySelector('.accordion-item:first-child .badge-warning, .accordion-item:first-child .badge-success');
    if (headerBadge) {
        headerBadge.textContent = result.risk_detected ? '1 riesgo' : '0 riesgos';
        headerBadge.className = result.risk_detected ? 'badge-warning' : 'badge-success';
    }

    // Actualizar alerta principal
    updateMainAlert(result, 'Falla Planar');
}

/**
 * Actualiza la sección de resultados para falla en cuña
 */
function updateWedgeResult(result) {
    const wedgeSection = document.querySelector('.accordion-item:last-child');
    if (!wedgeSection) return;

    const badge = wedgeSection.querySelector('.status-badge');
    if (badge) {
        badge.textContent = result.risk_detected ? '1 riesgo' : '0 riesgos';
        badge.className = result.risk_detected ? 'status-badge danger' : 'status-badge success';
    }
}

/**
 * Actualiza la alerta principal
 */
function updateMainAlert(result, type) {
    const alertCard = document.querySelector('.alert-card');
    if (!alertCard) return;

    const icon = alertCard.querySelector('.alert-icon-wrapper');
    const title = alertCard.querySelector('.alert-text h4');
    const msg = alertCard.querySelector('.alert-text p');

    if (result.risk_detected) {
        alertCard.className = 'alert-card warning';
        if (icon) icon.textContent = '⚠️';
        if (title) title.textContent = 'Riesgo Detectado';
        if (msg) msg.textContent = `Se identificó potencial deslizamiento en ${type}`;
    } else {
        alertCard.className = 'alert-card success';
        if (icon) icon.textContent = '✅';
        if (title) title.textContent = 'Sin Riesgos';
        if (msg) msg.textContent = 'No se detectaron condiciones de falla';
    }
}

/**
 * Ejecuta análisis completo para N discontinuidades
 */
function runAutoAnalysis() {
    if (!window.MathEngine) {
        console.warn('MathEngine no disponible');
        return;
    }

    const data = getAnalysisData();
    const { talud, friccion, discontinuidades } = data;

    // Solo analizar si hay datos mínimos
    const hasTalud = talud.manteo > 0 || talud.rumbo > 0;
    if (!hasTalud || discontinuidades.length === 0) {
        clearResults();
        return;
    }

    // Arrays para almacenar resultados
    const planarResults = [];
    const wedgeResults = [];

    // Análisis Planar: Para cada discontinuidad
    discontinuidades.forEach((disc, i) => {
        try {
            const result = window.MathEngine.analyzePlanar(talud, disc, friccion);
            planarResults.push({
                discId: disc.id,
                disc: disc,
                result: result
            });
            console.log(`📊 Planar D${disc.id}:`, result.risk_detected ? 'RIESGO' : 'Estable');
        } catch (e) {
            console.error(`Error en análisis planar D${disc.id}:`, e);
        }
    });

    // Análisis Cuña: Para cada par de discontinuidades
    for (let i = 0; i < discontinuidades.length; i++) {
        for (let j = i + 1; j < discontinuidades.length; j++) {
            try {
                const d1 = discontinuidades[i];
                const d2 = discontinuidades[j];
                const result = window.MathEngine.analyzeWedge(talud, d1, d2, friccion);
                wedgeResults.push({
                    disc1Id: d1.id,
                    disc2Id: d2.id,
                    disc1: d1,
                    disc2: d2,
                    result: result
                });
                console.log(`📊 Cuña D${d1.id}+D${d2.id}:`, result.risk_detected ? 'RIESGO' : 'Estable');
            } catch (e) {
                console.error(`Error en análisis cuña D${discontinuidades[i].id}+D${discontinuidades[j].id}:`, e);
            }
        }
    }

    // Actualizar UI con todos los resultados
    updateAllResults(planarResults, wedgeResults);
}

/**
 * Limpia los resultados cuando no hay datos
 */
function clearResults() {
    const planarContent = document.getElementById('planar-results-content');
    const wedgeContent = document.getElementById('wedge-results-content');

    if (planarContent) planarContent.innerHTML = '<p class="no-data">Ingrese datos del talud y discontinuidades</p>';
    if (wedgeContent) wedgeContent.innerHTML = '<p class="no-data">Se requieren 2+ discontinuidades</p>';

    updateMainAlert({ risk_detected: false }, 'Sin análisis');
}

/**
 * Actualiza toda la UI con los resultados
 */
function updateAllResults(planarResults, wedgeResults) {
    // Contar riesgos
    const planarRisks = planarResults.filter(r => r.result.risk_detected).length;
    const wedgeRisks = wedgeResults.filter(r => r.result.risk_detected).length;
    const totalRisks = planarRisks + wedgeRisks;

    // Actualizar sección Planar
    const planarContent = document.getElementById('planar-results-content');
    if (planarContent) {
        if (planarResults.length === 0) {
            planarContent.innerHTML = '<p class="no-data">Sin discontinuidades</p>';
        } else {
            let html = '';
            planarResults.forEach(pr => {
                const statusClass = pr.result.risk_detected ? 'danger' : 'success';
                const statusIcon = pr.result.risk_detected ? '⚠️' : '✅';
                const statusText = pr.result.risk_detected ? 'Inestable' : 'Estable';
                html += `
                    <div class="result-item ${statusClass}">
                        <strong>Discontinuidad ${pr.discId}</strong>
                        <span>Buz: ${pr.disc.manteo}° | Dir: ${pr.disc.rumbo}°</span>
                        <span class="status">${statusIcon} ${statusText}</span>
                    </div>
                `;
            });
            planarContent.innerHTML = html;
        }
    }

    // Actualizar badge planar
    const planarBadge = document.querySelector('.accordion-item:first-child .badge-warning, .accordion-item:first-child .badge-success');
    if (planarBadge) {
        planarBadge.textContent = planarRisks > 0 ? `${planarRisks} riesgo${planarRisks > 1 ? 's' : ''}` : '0 riesgos';
        planarBadge.className = planarRisks > 0 ? 'badge-warning' : 'badge-success';
    }

    // Actualizar sección Cuña
    const wedgeContent = document.getElementById('wedge-results-content');
    if (wedgeContent) {
        if (wedgeResults.length === 0) {
            wedgeContent.innerHTML = '<p class="no-data">Se requieren 2+ discontinuidades</p>';
        } else {
            let html = '';
            wedgeResults.forEach(wr => {
                const statusClass = wr.result.risk_detected ? 'danger' : 'success';
                const statusIcon = wr.result.risk_detected ? '⚠️' : '✅';
                const statusText = wr.result.risk_detected ? 'Inestable' : 'Estable';
                html += `
                    <div class="result-item ${statusClass}">
                        <strong>Cuña D${wr.disc1Id} + D${wr.disc2Id}</strong>
                        <span class="status">${statusIcon} ${statusText}</span>
                    </div>
                `;
            });
            wedgeContent.innerHTML = html;
        }
    }

    // Actualizar badge cuña
    const wedgeBadge = document.querySelector('.accordion-item:last-child .badge-warning, .accordion-item:last-child .badge-success');
    if (wedgeBadge) {
        wedgeBadge.textContent = wedgeRisks > 0 ? `${wedgeRisks} riesgo${wedgeRisks > 1 ? 's' : ''}` : '0 riesgos';
        wedgeBadge.className = wedgeRisks > 0 ? 'badge-warning' : 'badge-success';
    }

    // Actualizar alerta principal
    if (totalRisks > 0) {
        updateMainAlert({ risk_detected: true }, `${totalRisks} condición${totalRisks > 1 ? 'es' : ''} de riesgo`);
    } else {
        updateMainAlert({ risk_detected: false }, 'Análisis completo');
    }
}

// Inicializar event listeners para auto-análisis
const debouncedAnalysis = debounce(runAutoAnalysis, 300);

document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que los inputs existan
    setTimeout(() => {
        // Event listeners en todos los inputs
        document.querySelectorAll('.input-modern').forEach(input => {
            input.addEventListener('change', runAutoAnalysis);
            input.addEventListener('input', debouncedAnalysis);
        });

        // Observer para nuevas discontinuidades agregadas dinámicamente
        const discList = document.querySelector('.discontinuity-list');
        if (discList) {
            const observer = new MutationObserver(() => {
                document.querySelectorAll('.disc-item input').forEach(input => {
                    input.removeEventListener('change', runAutoAnalysis);
                    input.removeEventListener('input', debouncedAnalysis);
                    input.addEventListener('change', runAutoAnalysis);
                    input.addEventListener('input', debouncedAnalysis);
                });
            });
            observer.observe(discList, { childList: true, subtree: true });
        }

        // Attach listeners a discontinuidades existentes
        document.querySelectorAll('.disc-item input').forEach(input => {
            input.addEventListener('change', runAutoAnalysis);
            input.addEventListener('input', debouncedAnalysis);
        });

        console.log('✅ Auto-análisis inicializado');
    }, 500);
});
