# Stage 1: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build the app
FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# Inject PocketBase internal URL so it resolves correctly in the container
ENV VITE_POCKETBASE_URL=http://localhost:8090
RUN bun run build

# Stage 3: Production environment
FROM oven/bun:1-slim AS production
WORKDIR /app

# Ensure we have bash available for the start script
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy package info
COPY package.json ./

# Copy built frontend assets
COPY --from=build /app/dist ./dist
# We need node_modules for the SSR server to run
COPY --from=build /app/node_modules ./node_modules

# Copy PocketBase binary and migrations
COPY pocketbase-server ./
COPY pb_migrations ./pb_migrations

# Expose ports for both the Bun frontend and PocketBase backend
EXPOSE 3000
EXPOSE 8090

# Setup the entrypoint
COPY server.ts ./
COPY start.sh ./
RUN chmod +x start.sh

# Use the script to launch both PocketBase and the SSR server
CMD ["./start.sh"]
