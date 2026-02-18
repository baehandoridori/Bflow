@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo   Bflow 빌드
echo ========================================
echo.

REM Node.js 설치 확인
where node >nul 2>nul
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다!
    echo https://nodejs.org 에서 Node.js를 설치하세요.
    echo.
    pause
    exit /b 1
)

REM node_modules 폴더가 없으면 npm install 실행
if not exist "node_modules" (
    echo node_modules 폴더가 없습니다. 의존성을 설치합니다...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [오류] npm install 실패!
        pause
        exit /b 1
    )
    echo.
)

echo 빌드 시작...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo [오류] 빌드 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   빌드 완료! (dist 폴더)
echo ========================================
echo.
echo 미리보기를 실행합니다...
echo 브라우저에서 http://localhost:4173 을 열어주세요.
echo 종료: Ctrl+C
echo.

call npm run preview

echo.
echo 서버가 종료되었습니다.
pause
