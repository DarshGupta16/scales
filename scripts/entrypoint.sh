#!/bin/bash
set -e

echo "Starting scales container..."

# Ensure the data directory exists
mkdir -p /app/data

echo "Pushing database schema..."
bunx prisma db push --accept-data-loss

echo "Starting application server..."
exec bun run dist/server/server.js
