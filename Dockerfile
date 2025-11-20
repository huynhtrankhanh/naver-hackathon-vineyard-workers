# Multi-stage build for MoneyTrack App
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY Frontend-MoneyTrack/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY Frontend-MoneyTrack/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built backend from builder
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy backend env example (will be overridden by docker-compose)
COPY backend/.env.example ./.env.example

# Expose port
EXPOSE 3001

# Set environment variable
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"]
