#!/bin/bash
# entrypoint.sh — Arranque del contenedor catalog-sync
#
# 1. Regenera el crontab inyectando las env vars del container.
#    (cron NO hereda env vars del padre, asi que tenemos que pasarselas
#    explicitamente en el propio crontab. Sin esto, SUPABASE_DB_URL no
#    llega al sync.py disparado por cron y se saltea Supabase silenciosamente.)
# 2. Corre un sync inicial inmediatamente (para no esperar 1h al cron)
# 3. Arranca cron en foreground (PID 1) para que el container quede vivo
#    y la salida de los crons aparezca en docker logs.

set -u

echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] catalog-sync container starting..."

# Regenerar el crontab con las env vars actuales del container
echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] Configurando crontab con env vars del container..."
{
  echo "# Generado por entrypoint.sh al boot del container — NO editar a mano."
  echo "GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS:-/app/service-account.json}"
  echo "TZ=${TZ:-America/Asuncion}"
  if [ -n "${SUPABASE_DB_URL:-}" ]; then
    echo "SUPABASE_DB_URL=$SUPABASE_DB_URL"
    echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] ✓ SUPABASE_DB_URL inyectada al crontab" >&2
  else
    echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] ⚠ SUPABASE_DB_URL no esta en el env del container — el cron no va a poder escribir a Supabase" >&2
  fi
  echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  echo ""
  echo "# Ejecutar sync cada hora en el minuto 5 (00:05, 01:05, ...)"
  echo "5 * * * * cd /app && /usr/local/bin/python sync.py > /proc/1/fd/1 2>/proc/1/fd/2"
} | crontab -

echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] Ejecutando sync inicial..."

if /usr/local/bin/python /app/sync.py; then
  echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] Sync inicial OK"
else
  echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] Sync inicial FAILED (se reintentará en el próximo ciclo horario)"
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] Iniciando cron (sync cada hora en :05)..."
exec cron -f
