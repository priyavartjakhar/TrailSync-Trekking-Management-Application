#!/bin/bash

# Exit on error
set -e

echo "======================================================="
echo "  🏔️  Trail Sync - Trekking Management Application      "
echo "======================================================="
echo ""
# Start the Celery worker
echo "[1/3] Starting Celery worker..."
PYTHONPATH=. celery -A backend.tasks.celery_app worker --loglevel=info &
CELERY_PID=$!

# Start the Flask backend server
echo "[2/3] Starting local development server on port 8000..."
PYTHONPATH=. python3 backend/app.py &
SERVER_PID=$!

echo "[3/3] Opening homepage in your default browser..."
sleep 2.0
open http://localhost:8000

echo ""
echo "✅ Project is running at: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the services."

# Cleanup function to stop all background processes
cleanup() {
  echo -e "\nStopping servers..."
  kill $SERVER_PID $CELERY_PID 2>/dev/null || true
}
# Trap SIGINT, SIGTERM, and EXIT to run cleanup
trap cleanup SIGINT SIGTERM EXIT

# Keep script running to maintain the server processes
wait $SERVER_PID $CELERY_PID

