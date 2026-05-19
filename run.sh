#!/bin/bash

# Exit on error
set -e

echo "======================================================="
echo "  🏔️  Trail Sync - Trekking Management Application      "
echo "======================================================="
echo ""
echo "[1/2] Starting local development server on port 8000..."

# Navigate to frontend directory and start Python HTTP server
cd frontend
python3 -m http.server 8000 &
SERVER_PID=$!

echo "[2/2] Opening homepage in your default browser..."
sleep 1.5
open http://localhost:8000

echo ""
echo "✅ Project is running at: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the server."

# Trap SIGINT (Ctrl+C) to cleanly shut down the background server
trap "echo -e '\nStopping server...'; kill $SERVER_PID; exit 0" SIGINT SIGTERM

# Keep script running to maintain the server process
wait $SERVER_PID
