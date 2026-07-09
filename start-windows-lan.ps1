$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$port = 8765
$url = "http://127.0.0.1:$port/"

# Ask only once whether localhost should start automatically with Windows.
$launcherStateDir = Join-Path $env:LOCALAPPDATA "PixelPenguin"
$launcherChoiceFile = Join-Path $launcherStateDir "localhost-autostart-choice.txt"
$startupShortcut = Join-Path ([Environment]::GetFolderPath("Startup")) "像素企鹅 localhost.lnk"

if (-not (Test-Path -LiteralPath $launcherChoiceFile)) {
    Add-Type -AssemblyName PresentationFramework
    $choice = [System.Windows.MessageBox]::Show(
        "是否让像素企鹅 localhost 在每次开机后自动启动？`n`n选择【是】：以后开机自动在后台运行。`n选择【否】：不添加开机启动，以后也不再询问。",
        "像素企鹅首次启动",
        [System.Windows.MessageBoxButton]::YesNo,
        [System.Windows.MessageBoxImage]::Question
    )

    New-Item -ItemType Directory -Path $launcherStateDir -Force | Out-Null
    if ($choice -eq [System.Windows.MessageBoxResult]::Yes) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($startupShortcut)
        $shortcut.TargetPath = (Get-Command powershell.exe).Source
        $shortcut.Arguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`""
        $shortcut.WorkingDirectory = $PSScriptRoot
        $shortcut.WindowStyle = 7
        $shortcut.Description = "开机后在后台启动像素企鹅 localhost"
        $shortcut.Save()
        [System.IO.File]::WriteAllText($launcherChoiceFile, "yes", [System.Text.UTF8Encoding]::new($false))
        [System.Windows.MessageBox]::Show("已添加开机自动启动。", "像素企鹅") | Out-Null
    } else {
        [System.IO.File]::WriteAllText($launcherChoiceFile, "no", [System.Text.UTF8Encoding]::new($false))
    }
}

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Start-Process $url
    exit 0
}

$python = Get-Command python -ErrorAction SilentlyContinue
$pythonArgs = @("-m", "http.server", $port, "--bind", "0.0.0.0")
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
    $pythonArgs = @("-3", "-m", "http.server", $port, "--bind", "0.0.0.0")
}

if (-not $python) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
        "没有找到 Python，暂时无法启动像素企鹅。请先安装 Python，并在安装时勾选 Add Python to PATH。",
        "像素企鹅启动失败",
        [System.Windows.MessageBoxButton]::OK,
        [System.Windows.MessageBoxImage]::Error
    ) | Out-Null
    exit 1
}

Start-Job -ScriptBlock {
    param($targetUrl)
    Start-Sleep -Seconds 1
    Start-Process $targetUrl
} -ArgumentList $url | Out-Null

& $python.Source @pythonArgs