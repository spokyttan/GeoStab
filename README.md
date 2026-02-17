# GeoStab - Sistema de Análisisis Geotécnico

Sistema de monitoreo y análisis de estabilidad de taludes con capacidades offline, gestión de proyectos y alertas tempranas.

## 🎯 Características Principales

- ✅ **PWA Offline-First**: Funciona sin conexión a internet
- ✅ **Análisis Cinemático**: Detección de fallas planares y en cuña
- ✅ **Gestión de Proyectos**: Guardar, cargar y gestionar múltiples proyectos
- ✅ **Aislamiento por Sesión**: Privacidad de datos con UUIDs anónimos
- ✅ **Sincronización Automática**: Cola de datos local con sync cuando hay conexión
- ✅ **Interfaz Moderna**: Diseño responsive con gestión dinámica de discontinuidades
- ✅ **SSL/HTTPS**: Desplegado en producción con certificado Let's Encrypt

## 🏗️ Arquitectura

### Frontend (PWA)
- **Stack**: HTML5 + CSS3 + Vanilla JavaScript
- **Motor Matemático**: `public/js/math_engine.js` (análisis geotécnico)
- **Service Worker**: Cache-first strategy para trabajo offline
- **LocalStorage**: Cola de sincronización, persistencia local y session UUID

### Backend (API)
- **Framework**: FastAPI (Python 3.9)
- **Base de Datos**: MySQL (INACAP) con Alembic migrations
- **Servidor**: Gunicorn + Uvicorn workers
- **Autenticación**: Session-based con UUID anónimos

### Infraestructura
- **Proxy**: Nginx (reverse proxy + SSL termination)
- **Contenedores**: Docker + Docker Compose
- **Dominio**: geostab.ddns.net
- **Servidor**: Ubuntu 20.04 LTS (Oracle Cloud Infrastructure - Free Tier)
- **Vitality Guard**: Servicio de mantenimiento de actividad de CPU

## 🛡️ Oracle Cloud Vitality Guard

Oracle Cloud Free Tier puede reclamar instancias (detenerlas) si su uso de CPU es inferior al umbral mínimo durante períodos prolongados.

Para mitigar esto, hemos incluido el servicio `vitality-guard`:

- **Funcionamiento**: Ejecuta un script ligero (`scripts/keep_alive.py`) que realiza cálculos matemáticos intensivos durante 10 segundos.
- **Frecuencia**: Por defecto, cada 12 horas.
- **Configuración**: Intervalo ajustable mediante la variable de entorno `VITALITY_INTERVAL` en `docker-compose.yml`.

Este servicio asegura que la instancia reporte actividad de CPU periódica sin afectar el rendimiento general de la aplicación.

## 📁 Estructura del Proyecto

```
GeoStab/
├── .github/workflows/         # CI/CD (GitHub Actions)
├── docs/                      # Documentación e imágenes
│   └── imagenes-geostab/
├── nginx/                     # Configuración Nginx + SSL
├── public/                    # PWA estática
│   ├── index.html
│   ├── js/
│   │   ├── math_engine.js    # Motor de cálculo geotécnico
│   │   └── app.js            # Lógica de la app + SyncManager
│   ├── sw.js                 # Service Worker
│   └── manifest.json         # PWA manifest
├── scripts/                   # Scripts de utilidad
│   └── deploy.sh             # Script de despliegue automatizado
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
├── tests/                     # Tests unitarios
├── .env                       # Variables de entorno (no versionado)
├── .gitignore
├── docker-compose.yml        # Orquestación de servicios
├── Dockerfile.api
├── Dockerfile.ui
├── nginx_ui.conf
├── alembic.ini
├── requirements.txt
└── README.md
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
   docker-compose up -d --build
   ```

4. **Acceder a la aplicación**
   - PWA: http://localhost:8501
   - API Docs: http://localhost:8000/docs

## 🌐 Producción

**URL**: https://geostab.ddns.net  
**API**: https://geostab.ddns.net/api/docs

### Actualizar Producción

```bash
# Conectar al servidor
ssh ubuntu@<IP_SERVIDOR>

# Navegar al proyecto
cd ~/GeoStab

# Ejecutar script de despliegue
./scripts/deploy.sh
```

El script `deploy.sh` automatiza:
- Descarga de cambios desde GitHub
- Reconstrucción de contenedores Docker
- Aplicación de migraciones de base de datos
- Reinicio de servicios

## 📊 Estado Actual

### ✅ Completado
- [x] PWA con Service Worker y manifest
- [x] Interfaz responsive con gestión de discontinuidades
- [x] Motor matemático (análisis planar y wedge)
- [x] Sistema de sincronización offline
- [x] API completa con gestión de proyectos
- [x] Base de datos con migraciones Alembic
- [x] Aislamiento de proyectos por sesión UUID
- [x] Despliegue en producción con Docker
- [x] SSL/HTTPS con Let's Encrypt
- [x] Script de despliegue automatizado

### 🔮 Mejoras Futuras
- [ ] Sistema de autenticación de usuarios (reemplazar UUIDs anónimos)
- [ ] Validación geotécnica exhaustiva del motor matemático
- [ ] Tests unitarios e integración completos
- [ ] Integración con sensores/cámara
- [ ] Dashboard de análisis histórico

## 🔧 Comandos Útiles

```bash
# Logs en tiempo real
docker-compose logs -f

# Reiniciar servicio específico
docker-compose restart ui
docker-compose restart api

# Acceder al contenedor
docker-compose exec api bash

# Verificar base de datos
docker-compose exec -T api python -c "from db_utils.connection import get_db_connection; ..."

# Limpiar Service Worker (navegador)
# DevTools → Application → Service Workers → Unregister
```

## 🛠️ Desarrollo

### Instalar dependencias
```bash
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Ejecutar API localmente
```bash
cd src
uvicorn geostab_api.main:app --reload --port 8000
```

### Ejecutar PWA localmente
```bash
cd public
python -m http.server 8501
```

## 📝 Migraciones de Base de Datos

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