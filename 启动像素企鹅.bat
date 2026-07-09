@echo off
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -WindowStyle Hidden -Command "Start-Process powershell.exe -WindowStyle Hidden -ArgumentList '-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File','""%~dp0start-windows-lan.ps1""'"
exit /b 0