# GeoStab - Sistema de Análisis Geotécnico

Sistema de monitoreo y análisis de estabilidad de taludes con capacidades offline y alertas tempranas.

## 🎯 Características Principales

- ✅ **PWA Offline-First**: Funciona sin conexión a internet
- ✅ **Análisis Cinemático**: Detección de fallas planares y en cuña
- ✅ **Sincronización Automática**: Cola de datos local con sync cuando hay conexión
- ✅ **Interfaz Moderna**: Diseño responsive con tema oscuro/naranja
- ✅ **SSL/HTTPS**: Desplegado en producción con certificado Let's Encrypt

## 🏗️ Arquitectura

### Frontend (PWA)
- **Stack**: HTML5 + CSS3 + Vanilla JavaScript
- **Motor Matemático**: `public/js/math_engine.js` (análisis geotécnico)
- **Service Worker**: Cache-first strategy para trabajo offline
- **LocalStorage**: Cola de sincronización y persistencia local

### Backend (API)
- **Framework**: FastAPI (Python 3.9)
- **Base de Datos**: MySQL (INACAP)
- **Migraciones**: Alembic
- **Servidor**: Gunicorn + Uvicorn workers

### Infraestructura
- **Proxy**: Nginx (reverse proxy + SSL termination)
- **Contenedores**: Docker + Docker Compose
- **Dominio**: geostab.ddns.net
- **Servidor**: Ubuntu 22.04 LTS

## 📁 Estructura del Proyecto

```
GeoStab/
├── public/                    # PWA estática
│   ├── index.html            # Página principal
│   ├── css/style.css         # Estilos (inlined)
│   ├── js/
│   │   ├── math_engine.js    # Motor de cálculo geotécnico
│   │   └── app.js            # Lógica de la app + SyncManager
│   ├── sw.js                 # Service Worker
│   └── manifest.json         # PWA manifest
├── src/
│   ├── geostab_api/          # API FastAPI
│   │   ├── main.py           # Endpoints REST
│   │   └── models.py         # Modelos Pydantic
│   ├── engine/               # Motor matemático (Python)
│   │   └── math_engine.py
│   └── db_utils/             # Utilidades de BD
│       ├── connection.py
│       ├── queries.py
│       └── migrations/       # Alembic migrations
├── nginx_ui.conf             # Config Nginx para PWA
├── docker-compose.yml        # Orquestación de servicios
└── requirements.txt          # Dependencias Python
```

## 🚀 Despliegue Local

### Prerequisitos
- Docker & Docker Compose
- Python 3.9+ (para desarrollo local)

### Pasos

1. **Clonar repositorio**
   ```bash
   git clone https://github.com/spokyttan/GeoStab.git
   cd GeoStab
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. **Iniciar servicios**
   ```bash
   docker-compose up -d
   ```

4. **Acceder a la aplicación**
   - PWA: http://localhost:8501
   - API Docs: http://localhost:8000/docs

## 🌐 Producción

**URL**: https://geostab.ddns.net  
**API**: https://geostab.ddns.net/api/docs

### Actualizar Producción

```bash
# En tu máquina local
git push origin main

# Conectar al servidor
ssh ubuntu@geostab.ddns.net

# Actualizar código
cd ~/geostab
git pull origin main

# Reconstruir contenedores
sudo docker-compose up -d --build

# Reiniciar servicios
sudo docker-compose restart
```

## 📊 Estado Actual

### ✅ Completado
- [x] PWA con Service Worker y manifest
- [x] Interfaz responsive (diseño de Valeria)
- [x] Motor matemático básico (JS + Python)
- [x] Sistema de sincronización offline
- [x] API básica (FastAPI)
- [x] Despliegue en producción con Docker
- [x] SSL/HTTPS con Let's Encrypt
- [x] Cache-busting y optimización de assets

### ⏳ Pendiente
- [ ] **BLOQUEADO**: Conectividad Database (INACAP firewall)
- [ ] Migración de tabla `PROJECTS`
- [ ] Endpoints API para gestión de proyectos
- [ ] Validación geotécnica del motor matemático
- [ ] Tests unitarios e integración
- [ ] Integración con sensores/cámara

## 🔧 Comandos Útiles

```bash
# Logs en tiempo real
docker-compose logs -f

# Reiniciar servicio específico
docker-compose restart ui
docker-compose restart api

# Acceder al contenedor
docker-compose exec api bash

# Renovar certificado SSL
~/geostab/renew-cert.sh

# Limpiar caché del navegador (en producción)
# Visitar: https://geostab.ddns.net/reset.html
```

## 🛠️ Desarrollo

### Instalar dependencias
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Ejecutar API localmente
```bash
cd src
uvicorn geostab_api.main:app --reload --port 8000
```

### Ejecutar PWA localmente
```bash
# Cualquier servidor HTTP estático
cd public
python -m http.server 8501
```

## 📝 Migración de Base de Datos

```bash
# Crear nueva migración
alembic revision -m "descripcion"

# Aplicar migraciones
alembic upgrade head

# Revertir migración
alembic downgrade -1
```

## 👥 Equipo

- **Nattan**: Backend (API + DevOps)
- **Francisca**: Motor Matemático Geotécnico
- **Carlos**: Base de Datos
- **Valeria**: Diseño UI/UX

## 📄 Licencia

Proyecto académico - INACAP 2024

## 🔗 Links

- **Repositorio**: https://github.com/spokyttan/GeoStab
- **Producción**: https://geostab.ddns.net
- **API Docs**: https://geostab.ddns.net/api/docs

---

**Nota**: El proyecto actualmente experimenta un bloqueo de conectividad con la base de datos de INACAP (`Error 101: Network is unreachable`). La funcionalidad de sincronización offline permite seguir usando la aplicación mientras se resuelve el issue de infraestructura.