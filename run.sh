#!/bin/bash

echo "======================================================="
echo "  🏔️  Trail Sync - Trekking Management Application      "
echo "======================================================="
echo ""

# ── STEP 0: Full cleanup of any previous run ─────────────────
echo "[0/4] 🧹 Killing all previous processes and cleaning residue..."

# Kill every celery process (main + all forked pool children)
pkill -9 -f "celery" 2>/dev/null && echo "  ✔ Celery processes killed" || echo "  ℹ No Celery processes were running"

# Kill any previous Flask/python instance on port 8000
lsof -t -nP -i :8000 | xargs kill -9 2>/dev/null && echo "  ✔ Port 8000 cleared" || true

# Kill any previous Vite instance on port 5173
lsof -t -nP -i :5173 | xargs kill -9 2>/dev/null && echo "  ✔ Port 5173 cleared" || true

sleep 1

# Remove Celery beat schedule database
rm -f celerybeat-schedule.db celerybeat.pid celery.pid 2>/dev/null && echo "  ✔ Removed stale PID/schedule files" || true

# Flush stale Celery task queue from Redis
redis-cli -n 0 DEL celery 2>/dev/null && echo "  ✔ Flushed stale Celery queue from Redis" || true

# Clear Python bytecode cache
find backend/ -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend/ -name "*.pyc" -delete 2>/dev/null || true
echo "  ✔ Cleared Python __pycache__"

echo "  ✅ Environment is clean."
echo ""

# ── Ctrl+C and exit handler ──────────────────────────────────
cleanup() {
  # Disable all traps to avoid recursion/double-firing
  trap - EXIT SIGINT SIGTERM

  echo -e "\n🛑 Stopping all services..."

  # Kill background processes
  kill $SERVER_PID $CELERY_PID $VITE_PID 2>/dev/null || true

  # Force-kill any remaining celery processes
  pkill -9 -f "celery" 2>/dev/null || true

  # Force-clear ports using numerical ports (no service name resolution)
  lsof -t -nP -i :8000 | xargs kill -9 2>/dev/null || true
  lsof -t -nP -i :5173 | xargs kill -9 2>/dev/null || true

  echo "✔ All services stopped. Goodbye!"
  exit 0
}

# Trap exit, Ctrl+C (SIGINT), and kill (SIGTERM)
trap cleanup EXIT SIGINT SIGTERM

# ── STEP 1: Start fresh Celery worker ────────────────────────
echo "[1/4] 🚀 Starting Celery worker (fresh)..."
PYTHONPATH=. celery -A backend.tasks.celery_app worker --loglevel=info -B > celery.log 2>&1 &
CELERY_PID=$!
sleep 2

# ── STEP 2: Start Flask backend ──────────────────────────────
echo "[2/4] 🐍 Starting Flask backend on port 8000..."
PYTHONPATH=. python3 backend/app.py &
SERVER_PID=$!

# ── STEP 3: Start Vite frontend ──────────────────────────────
echo "[3/4] ⚡ Starting Vite dev server on port 5173..."
npm run dev &
VITE_PID=$!

# ── STEP 4: Open browser ─────────────────────────────────────
echo "[4/4] 🌐 Opening app in your default browser..."
sleep 3
open http://localhost:5173

echo ""
echo "✅ App is running at:       http://localhost:5173  (Vite — use this)"
echo "🔧 Flask API running at:   http://localhost:8000  (backend only)"
echo "📋 Celery logs at:         ./celery.log"
echo "🛑 Press Ctrl+C to stop all services."
echo ""

# Keep running and monitor background processes
while true; do
  # Check if all processes are running
  if ! kill -0 $SERVER_PID 2>/dev/null || \
     ! kill -0 $CELERY_PID 2>/dev/null || \
     ! kill -0 $VITE_PID 2>/dev/null; then
    echo "One of the services stopped unexpectedly."
    break
  fi
  sleep 1
done
