# Use a base image with Python 3.10 and Node.js 20
FROM nikolaik/python-nodejs:python3.10-nodejs20

# Install Redis server and utility tools
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=development
# Allow all hosts in Vite to prevent Host header validation failures behind Hugging Face's proxy
ENV __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=*

# Set working directory
WORKDIR /app

# Copy all application files
COPY . .

# Force-delete any copied macOS node_modules or .venv, then install dependencies fresh in Linux
RUN rm -rf node_modules .venv package-lock.json && \
    npm install && \
    pip install --no-cache-dir -r requirements.txt

# We intercept the celery binary to force it to use --concurrency=1
# This prevents the container from running out of memory (OOM) on free spaces
RUN which celery && \
    CELERY_PATH=$(which celery) && \
    mv $CELERY_PATH ${CELERY_PATH}.real && \
    printf '#!/bin/sh\nexec %s.real "$@" --concurrency=1\n' "$CELERY_PATH" > $CELERY_PATH && \
    chmod +x $CELERY_PATH

# In Docker, we need Vite to listen on 0.0.0.0 on port 7860 (Hugging Face's default port).
# We intercept the Vite binary in node_modules and force it to bind to --host 0.0.0.0 and --port 7860.
RUN mkdir -p /app/node_modules/.bin && \
    rm -f /app/node_modules/.bin/vite && \
    printf '#!/bin/sh\nexec node /app/node_modules/vite/bin/vite.js --host 0.0.0.0 --port 7860 "$@"\n' > /app/node_modules/.bin/vite && \
    chmod +x /app/node_modules/.bin/vite

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Make the run script executable
RUN chmod +x run.sh

# Run Redis server in the background (using /tmp directory for write permissions under user 1000)
# and execute the existing startup script.
CMD redis-server --port 6379 --dir /tmp --dbfilename redis.rdb --daemonize yes && bash run.sh
