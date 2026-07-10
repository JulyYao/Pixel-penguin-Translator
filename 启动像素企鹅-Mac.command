#!/usr/bin/env bash
set -u

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="$HOME/Library/Application Support/PixelPenguin"
PID_FILE="$STATE_DIR/localhost.pid"
LOG_FILE="$STATE_DIR/localhost.log"
PORT=8765
URL="http://127.0.0.1:$PORT/"

mkdir -p "$STATE_DIR"

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    open "$URL"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display alert "无法启动像素企鹅" message "没有找到 Python 3。请先安装 Python 3，再重新双击启动。" as critical'
  exit 1
fi

cd "$PROJECT_DIR"
nohup python3 -m http.server "$PORT" --bind 0.0.0.0 >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 1
if kill -0 "$SERVER_PID" 2>/dev/null; then
  open "$URL"
else
  rm -f "$PID_FILE"
  osascript -e 'display alert "像素企鹅启动失败" message "本地服务未能启动，请检查 localhost.log。" as critical'
  exit 1
fi