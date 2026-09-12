---
title: TrailSync
emoji: 🏔️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# 🏔️ TrailSync — Trekking & Expedition Management Application

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Hugging%20Face%20Spaces-blue?style=for-the-badge&logo=huggingface)](https://priyavartjakhar-trailsync.hf.space)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/priyavartjakhar/TrailSync-Trekking-Management-Application/blob/main/Dockerfile)
[![Vue.js 3](https://img.shields.io/badge/Frontend-Vue.js%203-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Flask API](https://img.shields.io/badge/Backend-Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Redis Cache](https://img.shields.io/badge/Cache-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Celery Tasks](https://img.shields.io/badge/Tasks-Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)

> **TrailSync (TMA-V2)** is a comprehensive, multi-role web platform designed for trekking agencies, expedition guides, and trekkers. It streamlines guide assignments, customer bookings, payment tracking, automated PDF report generation, Redis caching, and asynchronous email reminders.

---

## 🌐 Live Demo & Test Accounts

🚀 **Live App URL**: [https://priyavartjakhar-trailsync.hf.space](https://priyavartjakhar-trailsync.hf.space)

Test the multi-role dashboards using these pre-seeded accounts:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@trailsync.com` | `admin123` | Full CRUD over treks, routes, guides, bookings, revenue analytics & support resolution |
| **Guide / Staff** | `staff@test.com` | `123456` | Active trek assignments, participant lists, altitude navigation tips & profile management |
| **Trekker (User)** | `test@gmail.com` | `123456` | Browse treks, book itineraries, payment history, medical checklist & support ticket submission |

---

## 📸 Application Screenshots & Interface Showcase

### 🌐 Public Landing Page & Authentication
| Landing Page Hero | Interactive Trek Map |
| :---: | :---: |
| ![Homepage](docs/screenshots/homepage.png) | ![Homepage Map](docs/screenshots/homepage_map.png) |

| Role Login Portal | Footer & Platform Navigation |
| :---: | :---: |
| ![Login Page](docs/screenshots/login_page.png) | ![Homepage Footer](docs/screenshots/homepage_footer.png) |

---

### 👑 Admin Control Center
| Main Admin Dashboard | Revenue & Growth Analytics |
| :---: | :---: |
| ![Admin Main Dashboard](docs/screenshots/admin_main_dashboard.png) | ![Admin Revenue Analytics](docs/screenshots/admin_reveune_analytics.png) |

| Staff & Guide Roster Management | Automated Business Report Center |
| :---: | :---: |
| ![Admin Staff Tab](docs/screenshots/admin_dash_staff_tab.png) | ![Admin Report Center](docs/screenshots/admin_report_center.png) |

---

### 🏔️ Trekker (User) Portal & Expeditions
| Trekker Overview Dashboard | Trek Catalog & Filtering |
| :---: | :---: |
| ![Trekker Main Dashboard](docs/screenshots/trekker_main_dash.png) | ![Trekker Explore Tab](docs/screenshots/trekker_explore_tab.png) |

| Detailed Trek Itineraries | Bookings, Receipts & Payment Status |
| :---: | :---: |
| ![Trekker Explore Treks](docs/screenshots/trekker_exploretreks.png) | ![Trekker Bookings](docs/screenshots/trekker_bookings.png) |

---

### 🎒 Staff & Guide Portal
| Guide Main Dashboard | Assigned Treks & Roster |
| :---: | :---: |
| ![Staff Main Dashboard](docs/screenshots/staff_main_dash.png) | ![Staff Assigned Treks](docs/screenshots/staff_assigned_treks_tab.png) |

| Staff Support Center | Trekker Community Social Feed |
| :---: | :---: |
| ![Staff Support Tab](docs/screenshots/staff_support_tab.png) | ![TrailSync Social](docs/screenshots/trailsync_social.png) |

---

## 🌟 Key Features

### 🏕️ Multi-Role Dashboards
* **Admin Panel**: Complete CRUD control over treks, routes, guides, and trekkers. Features real-time revenue analytics charts (Chart.js), support ticket resolution interfaces, and export tools.
* **Guide/Staff Portal**: View assigned active treks, participant rosters, high-altitude navigation tips, and personal profile management.
* **Trekker Dashboard**: Explore upcoming treks, book itineraries, view payment history, update medical profiles, submit support tickets, and access community discussions.

### ⚡ Performance & Asynchronous Operations
* **Redis Caching**: High-priority listing pages (public treks, route catalogues) are cached with custom TTLs to minimize database load.
* **Celery Background Workers**: Manages asynchronous background jobs:
  * Daily trekker email reminders.
  * Monthly business activity reports.
  * Automated booking confirmations & PDF receipts.
  * Marketing campaign distribution.

### 📊 PDF Generation & Billing
* Generates clean, print-friendly PDF summaries of trek bookings and monthly business reports dynamically using `xhtml2pdf`.

---

## 🛠️ Tech Stack & Architecture

```
                          Single Public Port (7860 or $PORT)
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   Gunicorn   │
                                  │ (Flask API & │
                                  │   Vue SPA)   │
                                  └──────┬───────┘
                                         │
                ┌────────────────────────┴────────────────────────┐
                ▼                                                 ▼
      ┌──────────────────┐                               ┌─────────────────┐
      │  Redis Database  │ ◄───────────────────────────► │ Celery Worker & │
      │  (Port 6379)     │                               │ Beat Scheduler  │
      └──────────────────┘                               └─────────────────┘
```

* **Frontend**: Vue.js 3 (Single Page Application), Vue Router, Chart.js, HTML5, Vanilla CSS.
* **Backend**: Flask, Flask-SQLAlchemy (ORM), SQLite database.
* **Task Queue & Caching**: Celery (Worker & Beat Scheduler), Redis (Broker & Cache Store).
* **Production Deployment**: Docker, Gunicorn WSGI.

---

## 💻 Local Setup & Installation

### Prerequisites
* Python 3.10+
* Node.js & npm (Node v18+)
* Redis Server (`redis-cli ping` returning `PONG`)

### Step-by-Step Run Procedures

1. **Clone the repository**:
   ```bash
   git clone https://github.com/priyavartjakhar/TrailSync-Trekking-Management-Application.git
   cd TrailSync-Trekking-Management-Application
   ```

2. **Create and activate virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**:
   ```bash
   npm install
   ```

4. **Start the application**:
   ```bash
   bash run.sh
   ```
   *This automatically cleans stale processes, starts Celery, launches Flask API on port 8000, runs Vite dev server on port 5173, and opens the app in your browser.*

---

## 🐳 Docker Deployment

The application is containerized with a multi-stage production Docker build:

```bash
# Build the Docker image
docker build -t trailsync .

# Run the container locally
docker run -p 7860:7860 trailsync
```

Once started, the application is available locally at `http://localhost:7860`.

---

## 📄 License & Attribution

Distributed under the MIT License. Built for the TrailSync Trekking & Expedition Management Platform.
