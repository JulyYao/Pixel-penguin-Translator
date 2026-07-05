#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$IP" ]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "$IP" ]; then
  IP="你的电脑局域网 IP"
fi

echo "对话翻译助手已启动："
echo "本机访问:   http://127.0.0.1:8765/"
echo "手机访问:   http://$IP:8765/"
echo ""
echo "保持这个窗口打开。手机和电脑需要在同一个 Wi-Fi。"
python3 -m http.server 8765 --bind 0.0.0.0