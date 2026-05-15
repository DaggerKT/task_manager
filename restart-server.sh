#!/bin/bash
set -e

SERVICE=${1:-""}

echo "========================================"
echo "  Restart Services"
echo "========================================"

case "$SERVICE" in
  app)
    echo "Restarting: app only..."
    docker compose restart app
    ;;
  realtime)
    echo "Restarting: realtime only..."
    docker compose restart realtime
    ;;
  db)
    echo "Restarting: db only..."
    docker compose restart db
    ;;
  all|"")
    echo "Restarting: all services..."
    docker compose restart
    ;;
  *)
    echo "[ERROR] ไม่รู้จัก service: '$SERVICE'"
    echo "Usage: $0 [app|realtime|db|all]"
    exit 1
    ;;
esac

sleep 2
echo ""
echo "สถานะปัจจุบัน:"
docker compose ps

echo ""
echo "========================================"
echo "  Restart เสร็จแล้ว"
echo "========================================"
