@echo off
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$connections = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue; if ($connections) { $connections | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('像素企鹅本地服务已关闭。','像素企鹅') | Out-Null } else { Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('像素企鹅本地服务当前没有运行。','像素企鹅') | Out-Null }"
exit /b 0