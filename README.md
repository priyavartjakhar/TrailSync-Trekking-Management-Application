---
title: TrailSync
emoji: 🏆
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🏔️ TrailSync — Trekking & Expedition Management Application

TrailSync (TMA-V2) is a comprehensive, multi-role web platform designed for trekking agencies, guides, and trekkers. It streamlines the orchestration of high-altitude treks, guide assignments, customer bookings, payment tracking, PDF report generation, and community support ticket management.

> [!IMPORTANT]
> **🚀 Live Demo**: **[https://huggingface.co/spaces/priyavartjakhar/TrailSync](https://huggingface.co/spaces/priyavartjakhar/TrailSync)**  
> 💻 **Best View**: For the best user experience and accurate layout rendering, please open the live link in **Google Chrome**.

---

## 🌟 Key Features

### 🏕️ Multi-Role Dashboards
*   **Admin Panel**: Full CRUD control over treks, routes, guides, and trekkers. Features real-time revenue analytics charts (Chart.js), support ticket resolution interfaces, and export tools.
*   **Guide/Staff Dashboard**: Shows assigned active treks, list of participants, high-altitude navigation tips, and personal profile management.
*   **Trekker (User) Dashboard**: Allows searching treks, booking itineraries, reviewing payment history, managing active booking profiles, submitting support tickets, and accessing social features.

### ⚡ Performance & Asynchronous Operations
*   **Redis Caching**: High-priority listing pages (like public treks and routes) are cached with custom TTLs (Time-To-Live) to reduce database load and speed up response times.
*   **Celery Background Tasks**: Manages asynchronous tasks including:
    *   Daily trekker email reminders.
    *   Monthly agency business reports.
    *   On-demand PDF booking confirmations.
    *   Marketing campaign delivery.

### 📊 PDF Reports & Billing
*   Generates clean, print-friendly PDF summaries of trek details and bookings dynamically using `xhtml2pdf`.

---

## 🛠️ Tech Stack

*   **Frontend**: Vue.js 3 (Single Page Application), Vue Router, Chart.js (for revenue metrics), HTML5, and Vanilla CSS.
*   **Backend**: Flask, Flask-SQLAlchemy (ORM), SQLite (database storage).
*   **Task Queue & Caching**: Celery (Background Worker & Beat Scheduler), Redis (Broker & Cache Store).
*   **Production Server**: Docker, Gunicorn (production WSGI).

---

## 💻 Local Setup & Installation

To run this application locally, follow these steps:

### 📋 Prerequisites
*   Python 3.10+
*   Node.js & npm (Node v18+)
*   Redis Server (running locally on port `6379`)

### ⚙️ Step-by-Step Run Procedures

1. **Clone or Navigate to the project folder**:
   ```bash
   cd Trekking-Management-Application
   ```

2. **Create and activate a Python virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install python backend requirements**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Install frontend packages**:
   ```bash
   npm install
   ```

5. **Ensure Redis is running**:
   - Check status: `redis-cli ping` (Should return `PONG`)
   - Start Redis (macOS): `brew services start redis`

6. **Start the application**:
   ```bash
   bash run.sh
   ```
   *This automatically cleans up stale tasks, starts the Celery worker, launches the Flask backend (port 8000), runs the Vite dev server (port 5173), and opens the app in your browser.*

---

## 🐳 Docker Deployment

The application is fully containerized. To build and run the entire stack (Redis, Celery, Flask, and Vite) in a single container locally:

```bash
# Build the image
docker build -t trailsync .

# Run the container
docker run -p 7860:7860 trailsync
```
Once started, the application will be available at `http://localhost:7860`.
