#!/bin/bash
# Script de Despliegue Simple para GeoStab
# Ejecutar en el servidor de producción (geostab.ddns.net)

set -e  # Detener si hay errores

echo "🚀 Iniciando despliegue de GeoStab..."

# 1. Navegar al directorio del proyecto
cd ~/GeoStab || { echo "❌ Error: Directorio GeoStab no encontrado"; exit 1; }

# 2. Respaldar .env actual (por si acaso)
cp .env .env.backup || echo "⚠️  No se pudo respaldar .env"

# 3. Obtener últimos cambios de GitHub
echo "📥 Descargando cambios desde GitHub..."
git fetch origin main
git reset --hard origin/main

# 4. Detener contenedores actuales
echo "🛑 Deteniendo contenedores..."
sudo docker-compose down || true

# 5. Construir solo la UI (ligera) y usar API en modo pull-only si es posible
# Construir de forma eficiente para evitar OOM
echo "🔨 Construyendo UI..."
sudo docker-compose build ui

echo "🔨 Construyendo API (puede tardar)..."
sudo docker-compose build api

# 6. Levantar servicios
echo "▶️  Iniciando servicios..."
sudo docker-compose up -d

# 7. Ejecutar migraciones de base de datos
echo "🗄️  Ejecutando migraciones..."
sudo docker-compose exec -T api alembic upgrade head || echo "⚠️  Migraciones fallaron o ya están aplicadas"

# 8. Verificar estado
echo "✅ Verificando estado de los contenedores..."
sudo docker-compose ps

echo ""
echo "🎉 Despliegue completado!"
echo "📍 La aplicación debería estar disponible en https://geostab.ddns.net"
echo ""
echo "Para ver logs:"
echo "  sudo docker-compose logs -f --tail=100"
