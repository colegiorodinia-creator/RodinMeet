# Base image for building
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies for both backend and frontend
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy all source files
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy backend package and install only production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/*.json ./backend/

# Criar pasta de uploads para o multer
RUN mkdir -p /app/uploads && chmod 777 /app/uploads
# Expose backend port
EXPOSE 5000

# Start command
CMD ["node", "backend/dist/index.js"]
