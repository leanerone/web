# CIM Work Manager - 一键启动脚本
# 用法: 右键 -> 使用 PowerShell 运行

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CIM Work Manager 一键启动脚本" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = $ProjectRoot

Write-Host "项目根目录: $ProjectRoot" -ForegroundColor Yellow

# 1. 检查 Python
$pythonCmd = $null
foreach ($cmd in @("python", "py", "python3")) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonCmd = $cmd
            Write-Host "[OK] 找到 Python: $cmd ($version)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Host "[ERROR] 未找到 Python，请先安装 Python 3.8+" -ForegroundColor Red
    Write-Host "  下载地址: https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

# 2. 检查 Node.js
$nodeCmd = $null
$npmCmd = $null
foreach ($cmd in @("node")) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $nodeCmd = $cmd
            Write-Host "[OK] 找到 Node.js: $cmd ($version)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $nodeCmd) {
    Write-Host "[ERROR] 未找到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "  下载地址: https://nodejs.org/" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

# 检查 npm
try {
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $npmCmd = "npm"
        Write-Host "[OK] 找到 npm: $npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] 未找到 npm" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

# 3. 检查后端虚拟环境和依赖
$venvPath = Join-Path $BackendDir "venv"
$requirementsFile = Join-Path $BackendDir "requirements.txt"

if (Test-Path $requirementsFile) {
    Write-Host "`n[1/4] 检查后端依赖..." -ForegroundColor Yellow
    if (-not (Test-Path $venvPath)) {
        Write-Host "  创建 Python 虚拟环境..." -ForegroundColor Cyan
        Push-Location $BackendDir
        & $pythonCmd -m venv venv
        Pop-Location
    }

    $pipCmd = Join-Path $venvPath "Scripts\pip.exe"
    if (-not (Test-Path $pipCmd)) {
        $pipCmd = Join-Path $venvPath "bin\pip"
    }

    if (Test-Path $pipCmd) {
        Write-Host "  安装/更新后端依赖..." -ForegroundColor Cyan
        & $pipCmd install -r $requirementsFile -q
        Write-Host "  [OK] 后端依赖已就绪" -ForegroundColor Green
    }
}

# 4. 检查前端依赖
$nodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "`n[2/4] 安装前端依赖..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & npm install
    Pop-Location
    if (-not (Test-Path $nodeModules)) {
        Write-Host "[ERROR] 前端依赖安装失败" -ForegroundColor Red
        Read-Host "按回车退出"
        exit 1
    }
    Write-Host "  [OK] 前端依赖已就绪" -ForegroundColor Green
} else {
    Write-Host "`n[2/4] 前端依赖已存在，跳过安装" -ForegroundColor Green
}

# 5. 检查数据库
$dbFile = Join-Path $BackendDir "data\example_db.sqlite"
if (-not (Test-Path $dbFile)) {
    Write-Host "`n[3/4] 初始化数据库..." -ForegroundColor Yellow
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
    Write-Host "  [OK] 数据库初始化完成" -ForegroundColor Green
} else {
    Write-Host "`n[3/4] 数据库已存在" -ForegroundColor Green
}

# 6. 启动后端服务
Write-Host "`n[4/4] 启动服务..." -ForegroundColor Yellow

$backendStartCmd = @"
    Set-Location "$BackendDir"
    `$env:PYTHONPATH = "$BackendDir"
"@

if (Test-Path $venvPath) {
    $pythonExe = Join-Path $venvPath "Scripts\python.exe"
    if (Test-Path $pythonExe) {
        $backendStartCmd += "`n    & '$pythonExe' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    } else {
        $backendStartCmd += "`n    & '$pythonCmd' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    }
} else {
    $backendStartCmd += "`n    & '$pythonCmd' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
}

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command", $backendStartCmd
) -WindowStyle Normal -Title "CIM Backend API"

Write-Host "  后端API启动中..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 7. 启动前端服务
$frontendStartCmd = @"
    Set-Location "$FrontendDir"
    & '$npmCmd' run dev
"@

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command", $frontendStartCmd
) -WindowStyle Normal -Title "CIM Frontend"

Write-Host "  前端界面启动中..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 8. 完成提示
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  CIM Work Manager 启动完成!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "  后端API: http://localhost:8000" -ForegroundColor White
Write-Host "  前端界面: http://localhost:5173`n" -ForegroundColor White
Write-Host "  提示: 关闭 PowerShell 窗口即可停止服务`n" -ForegroundColor Yellow

try {
    Start-Process "http://localhost:5173"
} catch {}
