#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SCRIPT="$SCRIPT_DIR/docker-cleanup.sh"

if [[ ! -f "$CLEANUP_SCRIPT" ]]; then
  echo "[ERROR] cleanup script not found: $CLEANUP_SCRIPT"
  exit 1
fi

chmod +x "$CLEANUP_SCRIPT"

CRON_EXPR_1="30 3 * * *"
CRON_EXPR_2="45 12 * * *"
CRON_CMD="cd $SCRIPT_DIR && $CLEANUP_SCRIPT >> $SCRIPT_DIR/docker-cleanup.log 2>&1"

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v "docker-cleanup.sh" > "$TMP_CRON" || true
echo "$CRON_EXPR_1 $CRON_CMD" >> "$TMP_CRON"
echo "$CRON_EXPR_2 $CRON_CMD" >> "$TMP_CRON"
crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "[OK] Installed cron jobs:"
echo "  - $CRON_EXPR_1"
echo "  - $CRON_EXPR_2"
echo "[OK] Command: $CRON_CMD"
echo "[INFO] Verify with: crontab -l"
