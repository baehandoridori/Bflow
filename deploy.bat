@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo   Bflow 빌드 + 배포
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
echo 빌드 완료!
echo.

REM 배포 대상 선택
echo 어디에 배포할까요?
echo.
echo   1. 테스트 배포 (C:\Bflow)
echo   2. 실제 배포 (Google Drive)
echo   3. 둘 다
echo   4. 취소
echo.
set /p choice="선택 (1-4): "

if "%choice%"=="1" goto :deploy_test
if "%choice%"=="2" goto :deploy_prod
if "%choice%"=="3" goto :deploy_both
if "%choice%"=="4" goto :cancel
echo 잘못된 선택입니다.
pause
exit /b 1

:deploy_test
call :copy_to_test
goto :done

:deploy_prod
call :copy_to_prod
goto :done

:deploy_both
call :copy_to_test
call :copy_to_prod
goto :done

:copy_to_test
echo.
echo [테스트 배포] C:\Bflow 로 복사 중...
if not exist "C:\Bflow" mkdir "C:\Bflow"
xcopy /s /e /y /q "dist\*" "C:\Bflow\"
if errorlevel 1 (
    echo [오류] 테스트 배포 실패!
) else (
    echo [완료] 테스트 배포 성공!
)
exit /b 0

:copy_to_prod
set "PROD_PATH=G:\공유 드라이브\JBBJ 자료실\한솔이의 두근두근 실험실\Bflow"
echo.
echo [실제 배포] %PROD_PATH% 로 복사 중...
if not exist "%PROD_PATH%" (
    echo [오류] Google Drive 경로를 찾을 수 없습니다!
    echo 드라이브가 연결되어 있는지 확인하세요.
    exit /b 1
)
xcopy /s /e /y /q "dist\*" "%PROD_PATH%\"
if errorlevel 1 (
    echo [오류] 실제 배포 실패!
) else (
    echo [완료] 실제 배포 성공!
)
exit /b 0

:cancel
echo 배포를 취소했습니다.
goto :done

:done
echo.
echo ========================================
echo   배포 완료
echo ========================================
echo.
pause
