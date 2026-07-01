#!/bin/bash

# Exit on error
set -e

echo "======================================================="
echo "  🏔️  Trail Sync - Trekking Management Application      "
echo "======================================================="
echo ""

# Start the Celery worker
echo "[1/4] Starting Celery worker..."
PYTHONPATH=. celery -A backend.tasks.celery_app worker --loglevel=info &
CELERY_PID=$!

# Start the Flask backend server (API only, port 8000)
echo "[2/4] Starting Flask backend on port 8000..."
PYTHONPATH=. python3 backend/app.py &
SERVER_PID=$!

# Start the Vite dev server (frontend, port 5173)
echo "[3/4] Starting Vite dev server on port 5173..."
npm run dev &
VITE_PID=$!

echo "[4/4] Opening app in your default browser..."
sleep 3.0
open http://localhost:5173

echo ""
echo "✅ App is running at:       http://localhost:5173  (Vite — use this)"
echo "🔧 Flask API running at:   http://localhost:8000  (backend only)"
echo "🛑 Press Ctrl+C to stop all services."

# Cleanup function to stop all background processes
cleanup() {
  echo -e "\nStopping all servers..."
  kill $SERVER_PID $CELERY_PID $VITE_PID 2>/dev/null || true
}

# Trap SIGINT, SIGTERM, and EXIT to run cleanup
trap cleanup SIGINT SIGTERM EXIT

# Keep script running to maintain the server processes
wait $SERVER_PID $CELERY_PID $VITE_PID
