#!/bin/bash
set -e

# Merge static assets from all OpenNext workers into middleware's assets directory
# This allows the middleware to serve all static files directly without
# routing through service bindings (which bypass the Wrangler assets layer).

DEST="apps/middleware/.assets"
rm -rf "$DEST"
mkdir -p "$DEST"

for worker in apps/ssr-worker apps/ssg-worker; do
  if [ -d "$worker/.open-next/assets" ]; then
    cp -r "$worker/.open-next/assets/"* "$DEST/" 2>/dev/null || true
  fi
done

echo "Merged assets into $DEST ($(find "$DEST" -type f | wc -l | tr -d ' ') files)"
