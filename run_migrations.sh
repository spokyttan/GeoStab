#!/bin/bash
# Script para ejecutar migraciones de base de datos manualmente
# Uso: ./run_migrations.sh

echo "🚀 Iniciando proceso de migración..."

# 1. Activar entorno virtual
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✅ Entorno virtual activado"
else
    echo "❌ No se encontró .venv. Asegúrate de estar en la raíz del proyecto."
    exit 1
fi

# 2. Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo "❌ No se encontró el archivo .env"
    exit 1
fi

# 3. Ejecutar migración
echo "🔄 Ejecutando 'alembic upgrade head'..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migración exitosa!"
    echo "   La tabla PROJECTS ha sido creada y MEASUREMENTS actualizada."
else
    echo "❌ Error al ejecutar la migración."
    echo "   Verifica que tengas conexión a la red de INACAP (Ethernet/VPN)."
fi
