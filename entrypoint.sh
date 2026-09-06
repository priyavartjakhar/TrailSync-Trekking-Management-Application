#!/bin/bash
set -e

echo "======================================================="
echo "  🏔️ Starting TrailSync Container Services             "
echo "======================================================="

# Determine server port (defaults to 7860 for Hugging Face Spaces)
PORT=${PORT:-7860}
export PORT

echo "-> [1/3] Starting Redis server..."
redis-server --daemonize yes || echo "Redis server already running or failed to daemonize"

# Wait for Redis connection
for i in {1..10}; do
    if redis-cli ping >/dev/null 2>&1; then
        echo "   ✔ Redis is ready!"
        break
    fi
    echo "   Waiting for Redis..."
    sleep 1
done

echo "-> [2/3] Starting Celery worker & Beat scheduler..."
PYTHONPATH=. celery -A backend.tasks.celery_app worker -B --loglevel=info > celery.log 2>&1 &
CELERY_PID=$!
echo "   ✔ Celery process started with PID $CELERY_PID"

echo "-> [3/3] Starting Gunicorn web server on port $PORT..."
exec gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 120 backend.app:app
