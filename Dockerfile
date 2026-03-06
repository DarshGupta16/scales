# ── Stage 1: Install all deps + build ──
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build TanStack Start app + Service Worker
ENV NODE_ENV=production
RUN bun run build

# ── Stage 2: Production runner (minimal) ──
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Copy only the files needed at runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy the custom production server
COPY --from=builder /app/server.ts ./server.ts

# Install only production dependencies directly in the runner
RUN bun install --frozen-lockfile --production

# Strip unnecessary bloat from node_modules
RUN find node_modules \( \
      -name "*.md" -o -name "*.map" -o -name "LICENSE*" \
      -o -name "CHANGELOG*" -o -name "*.txt" -o -name "Makefile" \
    \) -type f -delete 2>/dev/null; \
    find node_modules -type d \( \
      -name "test" -o -name "tests" -o -name "__tests__" \
      -o -name "docs" -o -name "example" -o -name "examples" \
    \) -exec rm -rf {} + 2>/dev/null; \
    true

# Runtime configuration
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "mkdir -p /app/data && echo 'Pushing database schema...' && bunx prisma db push --accept-data-loss && echo 'Starting server...' && exec bun run server.ts"]
