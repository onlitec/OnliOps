# ============================================
# OnliOps Platform - Full Stack Single Container
# (Frontend + Backend for Coolify deployment)
# ============================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Production (Nginx + Node.js Backend)
FROM node:20-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor wget

# Create necessary directories
WORKDIR /app

# Copy backend code
COPY server/package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --only=production

COPY server/ ./

# Create uploads directory with proper permissions
RUN mkdir -p uploads/branding && chmod -R 755 uploads

# Copy nginx config
COPY ops/nginx/fullstack.conf /etc/nginx/http.d/default.conf
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy frontend build
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Create supervisor config
RUN mkdir -p /etc/supervisor.d
COPY <<EOF /etc/supervisor.d/onliops.ini
[supervisord]
nodaemon=true
logfile=/var/log/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=node /app/import-api.cjs
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=NODE_ENV="production"
EOF

# Expose port 3000 (Coolify default)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start supervisor (manages both nginx and node)
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
