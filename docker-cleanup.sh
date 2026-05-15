#!/usr/bin/env bash
set -euo pipefail

# Reclaim Docker disk usage while keeping active containers and mounted volumes.
# Safe defaults:
# - Remove unused images older than 7 days
# - Remove unused build cache older than 7 days
# - Remove stopped containers

echo "[docker-cleanup] Before cleanup"
docker system df || true

docker image prune -af --filter "until=168h"
docker builder prune -af --filter "until=168h"
docker container prune -f

echo ""
echo "[docker-cleanup] After cleanup"
docker system df || true

echo ""
echo "[docker-cleanup] Filesystem usage"
df -h
