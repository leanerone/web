# CIM Work Manager - One-Click Start Script
# Usage: Right-click -> Run with PowerShell

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CIM Work Manager - Start All" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = $ProjectRoot

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow

# 1. Check Python
$pythonCmd = $null
foreach ($cmd in @("python", "py", "python3")) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonCmd = $cmd
            Write-Host "[OK] Python found: $cmd ($version)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Host "[ERROR] Python not found. Please install Python 3.8+" -ForegroundColor Red
    Write-Host "  Download: https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 2. Check Node.js
$nodeCmd = $null
foreach ($cmd in @("node")) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $nodeCmd = $cmd
            Write-Host "[OK] Node.js found: $cmd ($version)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $nodeCmd) {
    Write-Host "[ERROR] Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    Write-Host "  Download: https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
$npmCmd = $null
try {
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $npmCmd = "npm"
        Write-Host "[OK] npm found: $npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] npm not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 3. Check backend venv and dependencies
$venvPath = Join-Path $BackendDir "venv"
$requirementsFile = Join-Path $BackendDir "requirements.txt"

if (Test-Path $requirementsFile) {
    Write-Host ""
    Write-Host "[1/4] Checking backend dependencies..." -ForegroundColor Yellow
    if (-not (Test-Path $venvPath)) {
        Write-Host "  Creating Python virtual environment..." -ForegroundColor Cyan
        Push-Location $BackendDir
        & $pythonCmd -m venv venv
        Pop-Location
    }

    $pipCmd = Join-Path $venvPath "Scripts\pip.exe"
    if (-not (Test-Path $pipCmd)) {
        $pipCmd = Join-Path $venvPath "bin\pip"
    }

    if (Test-Path $pipCmd) {
        Write-Host "  Installing/updating backend dependencies..." -ForegroundColor Cyan
        & $pipCmd install -r $requirementsFile -q
        Write-Host "  [OK] Backend dependencies ready" -ForegroundColor Green
    }
}

# 4. Check frontend dependencies
$nodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host ""
    Write-Host "[2/4] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & npm install
    Pop-Location
    if (-not (Test-Path $nodeModules)) {
        Write-Host "[ERROR] Frontend dependencies install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "  [OK] Frontend dependencies ready" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/4] Frontend dependencies exist, skip install" -ForegroundColor Green
}

# 5. Check database
$dbFile = Join-Path $BackendDir "data\example_db.sqlite"
if (-not (Test-Path $dbFile)) {
    Write-Host ""
    Write-Host "[3/4] Initializing database..." -ForegroundColor Yellow
    Push-Location $BackendDir
    if (Test-Path $venvPath) {
        $pythonExe = Join-Path $venvPath "Scripts\python.exe"
        if (-not (Test-Path $pythonExe)) {
            $pythonExe = Join-Path $venvPath "bin\python"
        }
        & $pythonExe init_db.py
    } else {
        & $pythonCmd init_db.py
    }
    Pop-Location
    Write-Host "  [OK] Database initialized" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[3/4] Database exists" -ForegroundColor Green
}

# 6. Start backend service
Write-Host ""
Write-Host "[4/4] Starting services..." -ForegroundColor Yellow

$backendExe = $pythonCmd
if (Test-Path $venvPath) {
    $candidate = Join-Path $venvPath "Scripts\python.exe"
    if (Test-Path $candidate) {
        $backendExe = $candidate
    }
}

$backendScript = "Set-Location '$BackendDir'; `$env:PYTHONPATH = '$BackendDir'; & '$backendExe' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Normal

Write-Host "  Backend API starting..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 7. Start frontend service
$frontendScript = "Set-Location '$FrontendDir'; & '$npmCmd' run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Normal

Write-Host "  Frontend starting..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 8. Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CIM Work Manager started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend UI:  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Tip: Close PowerShell windows to stop services" -ForegroundColor Yellow
Write-Host ""

try {
    Start-Process "http://localhost:5173"
} catch {}
