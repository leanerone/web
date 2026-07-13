@echo off
cd /d e:\AI\note\backend
py -3.11 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause