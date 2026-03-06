# Use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Build the app
FROM base AS builder
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set environment variables for build time
ENV NODE_ENV=production

# Generate Prisma Client
RUN bunx prisma generate

# Build the TanStack Start App and Service Worker
RUN bun run build

# Final runner stage
FROM base AS runner
WORKDIR /app

# Copy the built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy prisma schema for runtime schema pushing and configuration
COPY --from=builder /app/prisma ./prisma

# Copy the entrypoint script
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh

# Expose port 3000
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# The entrypoint script will handle running Prisma push and starting the server
CMD ["./scripts/entrypoint.sh"]
