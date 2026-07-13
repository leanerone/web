@echo off
start "CIM Backend" cmd /k "cd /d e:\AI\note\backend && py -3.11 -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "CIM Frontend" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d e:\AI\note && C:\Progra~1\nodejs\npm.cmd run dev"
echo.
echo ========================================
echo   CIM Work Manager 启动完成!
echo ========================================
echo.
echo   后端API: http://localhost:8000
echo   前端界面: http://localhost:5173
echo.
echo   按任意键关闭此窗口...
pause >nul