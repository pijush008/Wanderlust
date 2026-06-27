# ================= MULTI-STAGE DOCKERFILE =================
# Stage 1: Install dependencies
# Stage 2: Production image (smaller, no dev deps)

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including dev for build)
RUN npm ci --only=production && npm cache clean --force

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "app.js"]
