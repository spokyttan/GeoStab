/**
 * Sensor Manager for GeoStab
 * Handles camera, device orientation, and geolocation sensors
 */

class SensorManager {
    constructor() {
        this.camera = null;
        this.videoStream = null;
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
        this.location = { lat: null, lon: null, accuracy: null };
        this.isSupported = this.checkSupport();
        this.photos = []; // Array to store captured photos
        this.currentDiscontinuityIndex = null;
    }

    /**
     * Check browser support for various sensor APIs
     */
    checkSupport() {
        return {
            camera: !!navigator.mediaDevices?.getUserMedia,
            orientation: 'DeviceOrientationEvent' in window,
            geolocation: 'geolocation' in navigator,
            magnetometer: 'AbsoluteOrientationSensor' in window
        };
    }

    /**
     * Request all necessary permissions
     */
    async requestPermissions() {
        const permissions = { camera: false, orientation: false, geolocation: false };

        // Request camera permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            this.videoStream = stream;
            permissions.camera = true;
            console.log('✅ Camera permission granted');
        } catch (error) {
            console.error('❌ Camera permission denied:', error);
            permissions.camera = false;
        }

        // Request device orientation permission (iOS 13+ requires explicit permission)
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                permissions.orientation = permissionState === 'granted';
                console.log('✅ Orientation permission:', permissionState);
            } catch (error) {
                console.error('❌ Orientation permission denied:', error);
                permissions.orientation = false;
            }
        } else {
            // Android and older browsers don't require explicit permission
            permissions.orientation = this.isSupported.orientation;
        }

        // Request geolocation permission
        if (this.isSupported.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.location = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    permissions.geolocation = true;
                    console.log('✅ Geolocation acquired:', this.location);
                    this.updateGPSUI();
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                    permissions.geolocation = false;
                }
            );
        }

        return permissions;
    }

    /**
     * Start tracking device orientation
     */
    startOrientationTracking() {
        if (!this.isSupported.orientation) {
            console.warn('⚠️ Device orientation not supported');
            return;
        }

        window.addEventListener('deviceorientation', (event) => {
            this.orientation = {
                alpha: event.alpha || 0,  // Compass (0-360°)
                beta: event.beta || 0,    // Front-to-back tilt (-180 to 180°)
                gamma: event.gamma || 0   // Left-to-right tilt (-90 to 90°)
            };
            this.updateOrientationUI();
        }, true);

        console.log('🧭 Orientation tracking started');
    }

    /**
     * Calculate dip and dip direction from device orientation
     * Assumes device is held perpendicular to the rock face
     */
    calculateDipAndDirection() {
        // Convert device orientation to geological dip and dip direction
        // Beta represents the tilt (dip angle)
        const dip = Math.round(Math.abs(this.orientation.beta));

        // Alpha represents the compass direction
        // Add 180° and normalize to get dip direction
        let dipDirection = Math.round((this.orientation.alpha + 180) % 360);

        return { dip, dipDirection };
    }

    /**
     * Update UI with current orientation readings
     */
    updateOrientationUI() {
        const { dip, dipDirection } = this.calculateDipAndDirection();

        const dipElement = document.getElementById('dip-reading');
        const directionElement = document.getElementById('direction-reading');

        if (dipElement) dipElement.textContent = `${dip}°`;
        if (directionElement) directionElement.textContent = `${dipDirection}°`;
    }

    /**
     * Update UI with GPS coordinates
     */
    updateGPSUI() {
        const gpsElement = document.getElementById('gps-reading');
        if (gpsElement && this.location.lat && this.location.lon) {
            gpsElement.textContent = `${this.location.lat.toFixed(4)}, ${this.location.lon.toFixed(4)}`;
        }
    }

    /**
     * Setup camera preview in modal
     */
    setupCameraPreview() {
        const video = document.getElementById('camera-preview');
        const errorDiv = document.getElementById('camera-error');

        if (!this.videoStream) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠️ No se pudo acceder a la cámara';
            }
            return false;
        }

        if (video) {
            video.srcObject = this.videoStream;
            video.style.display = 'block';
            if (errorDiv) errorDiv.style.display = 'none';
            return true;
        }

        return false;
    }

    /**
     * Capture photo from video stream
     */
    async capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');

        if (!video || !canvas) {
            console.error('❌ Video or canvas element not found');
            return null;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Compress to JPEG (80% quality)
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Get current sensor readings
        const { dip, dipDirection } = this.calculateDipAndDirection();

        // Create photo object with metadata
        const photo = {
            id: `photo-${Date.now()}`,
            imageData: imageData,
            dip: dip,
            dipDirection: dipDirection,
            location: { ...this.location },
            timestamp: new Date().toISOString(),
            discontinuityIndex: this.currentDiscontinuityIndex
        };

        this.photos.push(photo);
        console.log('📸 Photo captured:', photo.id);

        return photo;
    }

    /**
     * Add photo thumbnail to gallery
     */
    addPhotoToGallery(photo) {
        const gallery = document.getElementById('photo-gallery');
        if (!gallery) return;

        const img = document.createElement('img');
        img.src = photo.imageData;
        img.className = 'photo-thumbnail';
        img.alt = `Photo ${photo.id}`;
        img.style.cursor = 'pointer';
        img.title = `Dip: ${photo.dip}° / Dir: ${photo.dipDirection}°`;

        // Click to view full size (simple implementation)
        img.addEventListener('click', () => {
            window.open(photo.imageData, '_blank');
        });

        gallery.appendChild(img);
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
            console.log('📷 Camera stopped');
        }
    }

    /**
     * Get photos for a specific discontinuity
     */
    getPhotosForDiscontinuity(index) {
        return this.photos.filter(photo => photo.discontinuityIndex === index);
    }

    /**
     * Clear all photos
     */
    clearPhotos() {
        this.photos = [];
        const gallery = document.getElementById('photo-gallery');
        if (gallery) gallery.innerHTML = '';
    }
}

// Export as global for use in app.js
window.SensorManager = SensorManager;
