#!/usr/bin/env bash
set -u

STATE_DIR="$HOME/Library/Application Support/PixelPenguin"
PID_FILE="$STATE_DIR/localhost.pid"

if [ ! -f "$PID_FILE" ]; then
  osascript -e 'display notification "本地服务当前没有运行" with title "像素企鹅"'
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"
if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
fi
rm -f "$PID_FILE"
osascript -e 'display notification "本地服务已关闭" with title "像素企鹅"'