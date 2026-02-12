FROM node:20 AS builder

WORKDIR /app

# Install root dependencies (includes better-sqlite3 which needs build tools)
COPY package.json package-lock.json ./
RUN npm ci

# Install client dependencies and build
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install only what's needed for better-sqlite3 to run
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built client and server
COPY --from=builder /app/client/dist ./client/dist
COPY server/ ./server/

EXPOSE 5000

CMD ["node", "server/index.js"]
