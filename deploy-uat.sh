#!/bin/bash
set -euo pipefail

# UAT deploy (no domain / no nginx / no ssl)
# - Pull latest code
# - Build Docker images
# - Start db/realtime/app
# - Run Prisma migrate deploy

BRANCH="${BRANCH:-main}"
PROJECT_DIR="$(pwd)"

echo "========================================"
echo "  UAT Deploy (No Domain)"
echo "  Branch: ${BRANCH}"
echo "  Dir:    ${PROJECT_DIR}"
echo "========================================"

cd "${PROJECT_DIR}"

# ── [0/6] Required files ──────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "[ERROR] ไม่พบไฟล์ .env"
  echo "        สร้างก่อนด้วย: cp .env.example .env"
  exit 1
fi

if [ ! -f ".env.production" ]; then
  echo "[ERROR] ไม่พบไฟล์ .env.production"
  echo "        สร้างก่อนด้วย: cp .env.production.example .env.production"
  exit 1
fi

# ── [1/6] Check Docker ─────────────────────────────────────────────────────────
echo ""
echo "[1/6] Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker ไม่พบในเครื่องนี้"
  echo "        ติดตั้ง Docker ก่อน แล้วรันใหม่"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[ERROR] Docker Compose plugin ไม่พร้อมใช้งาน"
  echo "        กรุณาตรวจสอบ docker installation แล้วลองใหม่"
  exit 1
fi

# ── [2/6] Pull latest code ────────────────────────────────────────────────────
echo ""
echo "[2/6] Pulling latest code..."
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

# ── [3/6] Build images ─────────────────────────────────────────────────────────
echo ""
echo "[3/6] Building Docker images..."
docker compose build --no-cache

# ── [4/6] Start services ───────────────────────────────────────────────────────
echo ""
echo "[4/6] Starting services (db, realtime, app)..."
docker compose up -d db realtime app

# ── [5/6] Run migrations ───────────────────────────────────────────────────────
echo ""
echo "[5/6] Running database migrations..."
docker compose run --rm migrate

# ── [6/6] Verify ───────────────────────────────────────────────────────────────
echo ""
echo "[6/6] Verifying services..."
docker compose ps

# Prefer LAN IP (e.g. 192.168.x.x) for internal UAT usage.
LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [ -n "${LOCAL_IP}" ]; then
  APP_URL="http://${LOCAL_IP}:3000"
  WS_URL="ws://${LOCAL_IP}:3001"
else
  APP_URL="http://<server-ip>:3000"
  WS_URL="ws://<server-ip>:3001"
fi

echo ""
echo "========================================"
echo "  UAT Deploy สำเร็จ"
echo "  App:      ${APP_URL}"
echo "  Realtime: ${WS_URL}"
echo "========================================"
