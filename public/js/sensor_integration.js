/**
 * Sensor Integration for GeoStab
 * Connects SensorManager with the UI camera buttons
 */

// Wait for DOM and SensorManager to be loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 Sensor integration loading...');

    // Wait a bit for app.js to initialize
    setTimeout(() => {
        initSensorIntegration();
    }, 500);
});

function initSensorIntegration() {
    // Check if SensorManager is available
    if (typeof SensorManager === 'undefined') {
        console.warn('⚠️ SensorManager not found. Skipping sensor integration');
        return;
    }

    // Initialize sensor manager
    const sensorManager = new SensorManager();
    console.log('📱 SensorManager initialized', sensorManager.isSupported);

    // Create modal HTML
    createSensorModal();

    // Attach listeners to all camera buttons
    attachCameraListeners(sensorManager);
}

function createSensorModal() {
    const modalHTML = `
        <div id="sensor-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 3000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: var(--dark-card); padding: 20px; border-radius: 16px; width: 90%; max-width: 600px; border: 1px solid rgba(255,255,255,0.1); max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: var(--primary); margin: 0;">📷 Captura con Sensores</h3>
                    <button id="btn-close-sensor-modal" style="background: rgba(255,255,255,0.1); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer;">✕</button>
                </div>
                
                <div style="width: 100%; background: #000; border-radius: 8px; overflow: hidden; margin-bottom: 20px; position: relative;">
                    <video id="camera-preview" autoplay playsinline style="width: 100%; display: block; max-height: 400px; object-fit: cover;"></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                    <div id="camera-error" style="display: none; padding: 40px; color: var(--danger); text-align: center;">
                        ⚠️ No se pudo acceder a la cámara
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <span style="display: block; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Buzamiento:</span>
                        <span id="dip-reading" style="display: block; color: var(--accent); font-size: 1.5rem; font-weight: bold;">--°</span>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <span style="display: block; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Dirección:</span>
                        <span id="direction-reading" style="display: block; color: var(--accent); font-size: 1.5rem; font-weight: bold;">--°</span>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); grid-column: span 2;">
                        <span style="display: block; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">GPS:</span>
                        <span id="gps-reading" style="display: block; color: var(--accent); font-size: 1rem; font-weight: bold;">--</span>
                    </div>
                </div>
                
                <button id="btn-capture-photo" class="btn-modern primary" style="width: 100%; padding: 12px; font-size: 1.1rem; margin-bottom: 20px;">
                    📸 Capturar Foto
                </button>
                
                <div id="photo-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: 20px; max-height: 200px; overflow-y: auto;">
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Sensor modal created');
}

function attachCameraListeners(sensorManager) {
    const cameraButtons = document.querySelectorAll('.btn-icon-modern.camera');

    cameraButtons.forEach((btn, index) => {
        btn.addEventListener('click', async () => {
            console.log(`📷 Camera button clicked for discontinuity ${index + 1}`);
            sensorManager.currentDiscontinuityIndex = index + 1;
            await openSensorModal(sensorManager);
        });
    });

    console.log(`✅ Attached camera listeners to ${cameraButtons.length} buttons`);
}

async function openSensorModal(sensorManager) {
    const modal = document.getElementById('sensor-modal');
    if (!modal) {
        console.error('❌ Sensor modal not found');
        return;
    }

    modal.style.display = 'flex';

    // Request permissions and start sensors
    try {
        const permissions = await sensorManager.requestPermissions();
        console.log('Permissions granted:', permissions);

        if (permissions.camera) {
            sensorManager.setupCameraPreview();
        }

        if (permissions.orientation) {
            sensorManager.startOrientationTracking();
        }
    } catch (error) {
        console.error('Error requesting permissions:', error);
        const errorDiv = document.getElementById('camera-error');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = `❌ Error: ${error.message || 'No se pudieron obtener permisos'}`;
        }
    }

    // Setup event listeners
    const btnClose = document.getElementById('btn-close-sensor-modal');
    const btnCapture = document.getElementById('btn-capture-photo');

    if (btnClose) {
        btnClose.onclick = () => closeSensorModal(sensorManager);
    }

    if (btnCapture) {
        btnCapture.onclick = async () => {
            const photo = await sensorManager.capturePhoto();
            if (photo) {
                sensorManager.addPhotoToGallery(photo);

                // Save photo to backend API
                await savePhotoToBackend(photo);

                btnCapture.textContent = '✅ Foto Capturada!';
                setTimeout(() => {
                    btnCapture.textContent = '📸 Capturar Foto';
                }, 2000);
            }
        };
    }
}

// Save photo to backend API (with offline queue support)
async function savePhotoToBackend(photo) {
    // Get session ID and project ID
    const sessionId = localStorage.getItem('geostab_session_id');
    const currentProjectId = parseInt(localStorage.getItem('current_project_id') || '0');

    if (!currentProjectId) {
        console.warn('⚠️ No project ID set. Photo saved locally only.');
        addPhotoToOfflineQueue(photo);
        return;
    }

    // Prepare API payload
    const photoData = {
        project_id: currentProjectId,
        discontinuity_index: photo.discontinuityIndex,
        image_data: photo.imageData,
        dip: photo.dip,
        dip_direction: photo.dipDirection,
        latitude: photo.location.lat,
        longitude: photo.location.lon,
        gps_accuracy: photo.location.accuracy,
        captured_at: photo.timestamp,
        session_id: sessionId
    };

    try {
        const response = await fetch('/api/photos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify(photoData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Photo saved to backend:', result.photo_id);
            // Optionally update photo object with server ID
            photo.serverId = result.photo_id;
        } else {
            console.error('❌ Failed to save photo:', response.status);
            addPhotoToOfflineQueue(photo);
        }
    } catch (error) {
        console.error('❌ Error saving photo to backend:', error);
        // Add to offline queue for later sync
        addPhotoToOfflineQueue(photo);
    }
}

// Add photo to offline queue for later synchronization
function addPhotoToOfflineQueue(photo) {
    const queue = JSON.parse(localStorage.getItem('photo_sync_queue') || '[]');
    queue.push(photo);
    localStorage.setItem('photo_sync_queue', JSON.stringify(queue));
    console.log('📥 Photo added to offline queue for later sync');
}

// Process offline queue (call this when connection is restored)
async function processOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('photo_sync_queue') || '[]');

    if (queue.length === 0) {
        console.log('📭 Offline queue is empty');
        return;
    }

    console.log(`📤 Processing ${queue.length} queued photos...`);
    const sessionId = localStorage.getItem('geostab_session_id');
    let successCount = 0;
    const failedPhotos = [];

    for (const photo of queue) {
        try {
            const photoData = {
                project_id: parseInt(localStorage.getItem('current_project_id') || '0'),
                discontinuity_index: photo.discontinuityIndex,
                image_data: photo.imageData,
                dip: photo.dip,
                dip_direction: photo.dipDirection,
                latitude: photo.location.lat,
                longitude: photo.location.lon,
                gps_accuracy: photo.location.accuracy,
                captured_at: photo.timestamp,
                session_id: sessionId
            };

            const response = await fetch('/api/photos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId
                },
                body: JSON.stringify(photoData)
            });

            if (response.ok) {
                successCount++;
                console.log(`✅ Synced photo ${photo.id}`);
            } else {
                failedPhotos.push(photo);
            }
        } catch (error) {
            failedPhotos.push(photo);
            console.error('❌ Failed to sync photo:', error);
        }
    }

    // Update queue with only failed photos
    localStorage.setItem('photo_sync_queue', JSON.stringify(failedPhotos));
    console.log(`✅ Synced ${successCount} photos. ${failedPhotos.length} remaining in queue.`);
}

// Auto-sync when connection is restored
window.addEventListener('online', () => {
    console.log('🌐 Connection restored. Processing offline queue...');
    setTimeout(() => {
        processOfflineQueue();
    }, 1000);
});

function closeSensorModal(sensorManager) {
    const modal = document.getElementById('sensor-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    if (sensorManager) {
        sensorManager.stopCamera();
    }
}
