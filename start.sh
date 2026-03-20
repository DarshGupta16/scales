#!/bin/bash

# Start PocketBase in the background
# It will read the pb_migrations directory and apply migrations on startup if necessary
# Data will be written to pb_data
echo "Starting PocketBase backend..."
./pocketbase-server serve --http=0.0.0.0:8090 --dir=./pb_data &
POCKETBASE_PID=$!

# Wait exactly one second to ensure PocketBase connects fully before the frontend starts serving
sleep 1

# Start the Bun SSR server in the foreground
echo "Starting Bun frontend SSR server..."
bun run server.ts

# If bun run preview stops, also stop PocketBase
kill $POCKETBASE_PID
