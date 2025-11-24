/**
 * GeoStab App Logic
 * Maneja la interacción con el DOM y la lógica de la aplicación.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('GeoStab App Initialized');

    // Referencias al DOM
    const btnAnalyze = document.querySelector('.btn-hero-primary'); // Botón "Ver Demo" -> Scroll
    const btnAnalyzeAction = document.querySelector('.btn-modern.primary'); // Botón Guardar (Simulado)
    const btnAnalyzeReal = document.querySelector('.demo-panel .btn-modern.primary'); // Botón Analizar (si existiera explícitamente)

    // En el HTML de Valeria, no hay un botón explícito de "Analizar" en el panel izquierdo, 
    // hay botones de "Guardar/Cargar". Vamos a convertir el botón "Guardar" en "Analizar" 
    // o añadir un listener al botón que añadiremos dinámicamente si falta.

    // Vamos a inyectar funcionalidad al botón "Guardar" para que actúe como "Analizar" para la demo
    const actionButtons = document.querySelectorAll('.button-group-demo button');
    if (actionButtons.length > 0) {
        const btnAnalyze = actionButtons[0];
        btnAnalyze.textContent = "⚡ ANALIZAR";
        btnAnalyze.classList.remove('secondary');
        btnAnalyze.classList.add('primary');

        btnAnalyze.addEventListener('click', (e) => {
            e.preventDefault();
            runAnalysis();
        });
    }

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
                    // Simulate API Call (Replace with real fetch when API is ready)
                    // const response = await fetch('/api/analyze/save', { ... });

                    // For now, we assume the API is blocked, so we simulate a failure if we really wanted to test sync
                    // But to demonstrate "Sync", we will simulate success after a timeout if online

                    // Real implementation would be:
                    /*
                    const response = await fetch('/api/projects/1/measurements', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item)
                    });
                    if (!response.ok) throw new Error('API Error');
                    */

                    console.log('Sincronizando item:', item);
                    // Simulating success for now to clear queue in demo
                    // In production, uncomment the fetch above and remove this line
                    await new Promise(r => setTimeout(r, 500));

                    this.removeFromQueue(item.id);
                } catch (error) {
                    console.error('Error al sincronizar item:', error);
                    // Keep in queue if failed
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
            // Try to send to API (Simulated for now as API is blocked)
            // In real scenario: fetch('/api/analyze', ...).catch(() => SyncManager.addToQueue(analysisData));

            // Since API is blocked, we will simulate a failure and add to queue to demonstrate functionality
            console.log("Intentando enviar a API... (Simulando fallo por bloqueo)");
            SyncManager.addToQueue(analysisData);
            showToast('Guardado localmente (API Bloqueada)', 'warning');
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
});
