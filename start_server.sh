#!/bin/bash
# Script para iniciar el servidor API
# Uso: ./start_server.sh

echo "🚀 Iniciando Servidor GeoStab..."

# 1. Activar entorno virtual
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "❌ No se encontró .venv"
    exit 1
fi

# 2. Limpiar puertos (8000, 8005, 8080 por si acaso)
echo "🧹 Limpiando puertos..."
fuser -k 8000/tcp > /dev/null 2>&1 || true
fuser -k 8005/tcp > /dev/null 2>&1 || true
fuser -k 8080/tcp > /dev/null 2>&1 || true
sleep 1

# 3. Iniciar Uvicorn
echo "📡 Servidor corriendo en http://127.0.0.1:8080"
echo "   Presiona Ctrl+C para detener."
uvicorn src.geostab_api.main:app --host 127.0.0.1 --port 8080 --reload
