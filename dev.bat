@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   Bflow 개발 서버 시작
echo ========================================
echo.
echo 브라우저에서 http://localhost:5173 을 열고 있습니다...
echo.
echo 서버를 종료하려면 Ctrl+C 를 누르세요.
echo ========================================
echo.

REM 2초 후 브라우저 열기 (서버가 시작될 시간을 줌)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

REM 개발 서버 실행
npm run dev

pause
