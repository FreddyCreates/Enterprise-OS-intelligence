# ═══════════════════════════════════════════════════════════════════════════════
# RSHIP Enterprise OS Intelligence — PowerShell Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# USAGE:
#   irm https://freddycreates.github.io/Enterprise-OS-intelligence/install.ps1 | iex
#
# This installs the RSHIP CLI to your system and configures it for immediate use.
# Supports Windows 10+, PowerShell 5.1+
#
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ── Configuration ─────────────────────────────────────────────────────────────
$Version = "1.0.0"
$RepoOwner = "FreddyCreates"
$RepoName = "Enterprise-OS-intelligence"
$BinaryName = "rship"
$InstallDir = "$env:LOCALAPPDATA\RSHIP"
$GithubBase = "https://github.com/$RepoOwner/$RepoName"
$ReleasesAPI = "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
$PagesBase = "https://freddycreates.github.io/Enterprise-OS-intelligence"

# ── Banner ────────────────────────────────────────────────────────────────────
function Show-Banner {
    $banner = @"

    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   ◎  RSHIP Enterprise OS Intelligence                        ║
    ║                                                              ║
    ║   Sovereign AI Infrastructure · Zero Third-Party AI          ║
    ║   Intelligent Cache Organisms · Production Runtime           ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝

"@
    Write-Host $banner -ForegroundColor Cyan
    Write-Host "  Installing RSHIP CLI v$Version..." -ForegroundColor White
    Write-Host ""
}

# ── Detect Architecture ───────────────────────────────────────────────────────
function Get-Architecture {
    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
    switch ($arch) {
        "X64"   { return "x86_64" }
        "Arm64" { return "aarch64" }
        default { 
            Write-Host "  [!] Unsupported architecture: $arch" -ForegroundColor Red
            exit 1
        }
    }
}

# ── Download CLI ──────────────────────────────────────────────────────────────
function Install-RSHIP {
    $arch = Get-Architecture

    # Create install directory
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }

    Write-Host "  [1/5] Detecting system... Windows $arch" -ForegroundColor Gray
    
    # Download the CLI wrapper
    $cliUrl = "$PagesBase/cli/rship-cli.js"
    $cliPath = Join-Path $InstallDir "rship-cli.js"
    
    Write-Host "  [2/5] Downloading RSHIP CLI..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $cliUrl -OutFile $cliPath -UseBasicParsing
    } catch {
        Write-Host "  [!] Download failed. Falling back to GitHub..." -ForegroundColor Yellow
        $cliUrl = "$GithubBase/raw/main/cli/rship-cli.js"
        Invoke-WebRequest -Uri $cliUrl -OutFile $cliPath -UseBasicParsing
    }

    # Create the batch launcher
    Write-Host "  [3/5] Creating launcher..." -ForegroundColor Gray
    $batchContent = @"
@echo off
node "%~dp0rship-cli.js" %*
"@
    $batchPath = Join-Path $InstallDir "rship.cmd"
    Set-Content -Path $batchPath -Value $batchContent -Encoding ASCII

    # Create PowerShell function wrapper
    $psContent = @"
function rship { node "$InstallDir\rship-cli.js" @args }
"@
    $psPath = Join-Path $InstallDir "rship.ps1"
    Set-Content -Path $psPath -Value $psContent -Encoding UTF8

    # Add to PATH
    Write-Host "  [4/5] Configuring PATH..." -ForegroundColor Gray
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$InstallDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
        $env:Path = "$env:Path;$InstallDir"
    }

    # Verify Node.js
    Write-Host "  [5/5] Verifying dependencies..." -ForegroundColor Gray
    $nodeCheck = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCheck) {
        Write-Host ""
        Write-Host "  [!] Node.js not found. Install from https://nodejs.org" -ForegroundColor Yellow
        Write-Host "      RSHIP CLI requires Node.js 18+ to run." -ForegroundColor Yellow
        Write-Host ""
    }

    return $true
}

# ── Post-Install ──────────────────────────────────────────────────────────────
function Show-PostInstall {
    Write-Host ""
    Write-Host "  ✓ RSHIP CLI installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │  Quick Start:                                           │" -ForegroundColor DarkGray
    Write-Host "  │                                                         │" -ForegroundColor DarkGray
    Write-Host "  │    rship                     — Interactive dashboard    │" -ForegroundColor White
    Write-Host "  │    rship status              — System health check      │" -ForegroundColor White
    Write-Host "  │    rship deploy              — Deploy to production     │" -ForegroundColor White
    Write-Host "  │    rship intel               — Intelligence console     │" -ForegroundColor White
    Write-Host "  │    rship apps                — List production apps     │" -ForegroundColor White
    Write-Host "  │    rship cache               — Cache organism control   │" -ForegroundColor White
    Write-Host "  │                                                         │" -ForegroundColor DarkGray
    Write-Host "  │  Modes:                                                 │" -ForegroundColor DarkGray
    Write-Host "  │                                                         │" -ForegroundColor DarkGray
    Write-Host "  │    rship --mode enterprise   — Full enterprise suite    │" -ForegroundColor White
    Write-Host "  │    rship --mode developer    — Developer tools          │" -ForegroundColor White
    Write-Host "  │    rship --mode operator     — Infrastructure ops       │" -ForegroundColor White
    Write-Host "  │    rship --mode sovereign    — Self-hosted sovereign    │" -ForegroundColor White
    Write-Host "  │                                                         │" -ForegroundColor DarkGray
    Write-Host "  └─────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Documentation: $PagesBase" -ForegroundColor DarkGray
    Write-Host "  Source:        $GithubBase" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Restart your terminal, then run: rship" -ForegroundColor Cyan
    Write-Host ""
}

# ── Main ──────────────────────────────────────────────────────────────────────
Show-Banner
$success = Install-RSHIP
if ($success) {
    Show-PostInstall
}
