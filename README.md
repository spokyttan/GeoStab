# GeoStab - Sistema de Análisis Geotécnico

## 🚀 Estado del Proyecto
- ✅ SSL/HTTPS configurado y funcionando
- ✅ Docker Compose en producción
- ✅ Nginx como reverse proxy
- 🔄 En desarrollo: UI (Valeria), DB queries (Carlos), Math engine (Francisca)

## 📦 Estructura
- `src/geostab_api/` - Backend FastAPI (Nattan)
- `src/engine/` - Motor matemático (Francisca)
- `src/db_utils/` - Conexiones DB (Carlos)
- `streamlit_app.py` - Frontend UI (Valeria)

## 🔧 Comandos Útiles
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Renovar certificado SSL
~/geostab/renew-cert.sh
```

## 🌐 URLs
- Producción: https://geostab.ddns.net
- API Docs: https://geostab.ddns.net/api/docs