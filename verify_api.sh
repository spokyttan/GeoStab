#!/bin/bash
# Script para verificar la API de Proyectos y Análisis
# Uso: ./verify_api.sh

echo "🚀 Iniciando verificación de API..."

# 1. Activar entorno virtual
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "❌ No se encontró .venv"
    exit 1
fi

# 2. Iniciar servidor API en segundo plano
echo "🧹 Limpiando puerto 8005..."
fuser -k 8005/tcp > /dev/null 2>&1 || true
sleep 2

echo "📡 Iniciando servidor API (puerto 8005)..."
uvicorn src.geostab_api.main:app --host 127.0.0.1 --port 8005 > api.log 2>&1 &
API_PID=$!

echo "   PID del servidor: $API_PID"
echo "   Esperando 5 segundos para que inicie..."
sleep 5

# 3. Ejecutar script de pruebas
echo "🧪 Ejecutando pruebas (test_api_projects.py)..."
python test_api_projects.py

TEST_EXIT_CODE=$?

# 4. Detener servidor
echo "🛑 Deteniendo servidor API..."
kill $API_PID

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Verificación exitosa!"
else
    echo "❌ Las pruebas fallaron. Revisa api.log para más detalles."
fi
