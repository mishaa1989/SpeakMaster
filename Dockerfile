# Build stage - Build frontend only
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build frontend only with vite
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (tsx needed for production runtime)
RUN npm ci

# Copy built frontend from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Copy all source files (server needs TypeScript files for tsx runtime)
COPY server ./server
COPY shared ./shared
COPY client ./client
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/admin/setup-required || exit 1

# Start application with tsx (handles TypeScript at runtime)
CMD ["npx", "tsx", "server/index.ts"]
