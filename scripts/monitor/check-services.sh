#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/service_status.log"

ts() { date "+%Y-%m-%d %H:%M:%S"; }

check_unit() {
  local unit="$1"
  local status
  status=$(systemctl is-active "$unit" || true)
  echo "[$(ts)] $unit: $status" | tee -a "$LOG_FILE"
}

check_port() {
  local port="$1"
  if ss -ltn | awk '{print $4}' | grep -q ":$port$"; then
    echo "[$(ts)] port:$port listening" | tee -a "$LOG_FILE"
  else
    echo "[$(ts)] port:$port NOT listening" | tee -a "$LOG_FILE"
  fi
}

check_http() {
  local url="$1"
  local code
  code=$(curl -sk -o /dev/null -w "%{http_code}" "$url")
  echo "[$(ts)] http:$url code:$code" | tee -a "$LOG_FILE"
}

check_unit postgresql
check_unit nginx
check_port 5432
check_port 443
check_http https://localhost/

