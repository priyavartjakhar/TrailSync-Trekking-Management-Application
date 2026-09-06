# ==========================================
# Stage 1: Build Vue.js Frontend Static SPA
# ==========================================
FROM node:18-slim AS frontend-builder
WORKDIR /app

# Copy package files
COPY package.json ./

# Install npm packages for Linux x64/arm64
RUN npm install

# Copy frontend source files and vite config
COPY vite.config.js ./
COPY frontend ./frontend

# Build Vue static production bundle into /app/frontend/dist
RUN npm run build

# ==========================================
# Stage 2: Production Runtime Environment
# ==========================================
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (Redis server, C compiler, PDF/image libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-server \
    curl \
    build-essential \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend dist from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source code and entrypoint script
COPY backend ./backend
COPY api.yaml ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

# Expose default Hugging Face Spaces / Render container port
EXPOSE 7860
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Launch Redis, Celery, and Flask/Gunicorn via entrypoint script
CMD ["/bin/bash", "./entrypoint.sh"]
