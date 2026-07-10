$ErrorActionPreference = "Stop"

$stateDir = Join-Path $env:LOCALAPPDATA "PixelPenguin"
$serverPidFile = Join-Path $stateDir "localhost-server.pid"

Add-Type -AssemblyName PresentationFramework

if (-not (Test-Path -LiteralPath $serverPidFile)) {
    [System.Windows.MessageBox]::Show("像素企鹅本地服务当前没有运行。", "像素企鹅") | Out-Null
    exit 0
}

$serverPid = [int]([System.IO.File]::ReadAllText($serverPidFile).Trim())
$processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid" -ErrorAction SilentlyContinue
$isPixelPenguinServer = $processInfo `
    -and $processInfo.Name -match '^python(w)?\.exe$' `
    -and $processInfo.CommandLine -match 'http\.server' `
    -and $processInfo.CommandLine -match '8765'

if ($isPixelPenguinServer) {
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    $message = "像素企鹅本地服务已关闭。"
} else {
    $message = "没有找到由像素企鹅启动的本地服务，未关闭其他程序。"
}

Remove-Item -LiteralPath $serverPidFile -Force -ErrorAction SilentlyContinue
[System.Windows.MessageBox]::Show($message, "像素企鹅") | Out-Null
