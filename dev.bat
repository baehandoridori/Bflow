@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo   Bflow 개발 서버
echo ========================================
echo.
echo 현재 폴더: %cd%
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

echo Node.js 버전:
node --version
echo.

REM package.json 확인
if not exist "package.json" (
    echo [오류] package.json 파일을 찾을 수 없습니다!
    echo 올바른 폴더에서 실행하고 있는지 확인하세요.
    echo.
    pause
    exit /b 1
)

REM node_modules 폴더가 없으면 npm install 실행
if not exist "node_modules" (
    echo node_modules 폴더가 없습니다.
    echo 의존성을 설치합니다... (시간이 좀 걸릴 수 있습니다)
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [오류] npm install 실패!
        pause
        exit /b 1
    )
    echo.
    echo 의존성 설치 완료!
    echo.
)

echo ----------------------------------------
echo 서버 시작 중...
echo 브라우저에서 http://localhost:5173 을 열어주세요.
echo 종료: Ctrl+C
echo ----------------------------------------
echo.

REM 개발 서버 실행
call npm run dev

echo.
echo 서버가 종료되었습니다.
pause
