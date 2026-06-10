# ═══════════════════════════════════════════════════════════════════════════════
# RSHIP Enterprise OS Intelligence — PowerShell Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# USAGE:
#   irm https://freddycreates.github.io/Enterprise-OS-intelligence/install.ps1 | iex
#
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$Version = "1.0.0"
$InstallDir = "$env:LOCALAPPDATA\RSHIP"
$PagesBase = "https://freddycreates.github.io/Enterprise-OS-intelligence"
$GithubBase = "https://github.com/FreddyCreates/Enterprise-OS-intelligence"

Write-Host ""
Write-Host "  ◎  RSHIP Enterprise OS Intelligence — Installing v$Version" -ForegroundColor Cyan
Write-Host ""

# Create install directory
if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }

# Download CLI
Write-Host "  [1/3] Downloading CLI..." -ForegroundColor Gray
$cliUrl = "$PagesBase/cli/rship-cli.js"
try {
    Invoke-WebRequest -Uri $cliUrl -OutFile "$InstallDir\rship-cli.js" -UseBasicParsing
} catch {
    Invoke-WebRequest -Uri "$GithubBase/raw/main/cli/rship-cli.js" -OutFile "$InstallDir\rship-cli.js" -UseBasicParsing
}

# Create launcher
Write-Host "  [2/3] Creating launcher..." -ForegroundColor Gray
Set-Content -Path "$InstallDir\rship.cmd" -Value '@echo off`nnode "%~dp0rship-cli.js" %*' -Encoding ASCII

# Add to PATH
Write-Host "  [3/3] Configuring PATH..." -ForegroundColor Gray
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
}

Write-Host ""
Write-Host "  ✓ Installed! Restart terminal, then run: rship" -ForegroundColor Green
Write-Host ""
