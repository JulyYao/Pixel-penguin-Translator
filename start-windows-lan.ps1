$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  $ip = "你的电脑局域网 IP"
}

Write-Host "对话翻译助手已启动："
Write-Host "本机访问:   http://127.0.0.1:8765/"
Write-Host "手机访问:   http://$ip`:8765/"
Write-Host ""
Write-Host "保持这个窗口打开。手机和电脑需要在同一个 Wi-Fi。"
python -m http.server 8765 --bind 0.0.0.0