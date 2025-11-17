@echo off
REM 첸트룸 타우러스 NAS 배포용 Docker 이미지 빌드 스크립트
REM Windows 용

echo =========================================
echo   첸트룸 타우러스 Docker 이미지 빌드
echo =========================================
echo.

REM 이미지 이름 및 태그
set IMAGE_NAME=centrum-taurus
set IMAGE_TAG=latest
set TAR_FILE=centrum-taurus.tar

REM Docker 설치 확인
echo [1/5] Docker 설치 확인...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Docker가 설치되어 있지 않습니다.
    echo Docker Desktop을 설치해주세요: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo [OK] Docker 설치 확인 완료
echo.

REM Docker 실행 확인
echo [2/5] Docker 실행 상태 확인...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Docker가 실행 중이지 않습니다.
    echo Docker Desktop을 실행해주세요.
    pause
    exit /b 1
)
echo [OK] Docker 실행 중
echo.

REM 이미지 빌드
echo [3/5] Docker 이미지 빌드 시작...
echo 예상 소요 시간: 5-10분
echo.

docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] 이미지 빌드 실패
    pause
    exit /b 1
)
echo.
echo [OK] 이미지 빌드 성공!
echo.

REM 이미지 저장
echo [4/5] 이미지를 TAR 파일로 저장...
docker save %IMAGE_NAME%:%IMAGE_TAG% -o %TAR_FILE%
if %ERRORLEVEL% NEQ 0 (
    echo [X] TAR 파일 생성 실패
    pause
    exit /b 1
)
echo [OK] TAR 파일 생성 완료: %TAR_FILE%
echo.

REM 파일 크기 확인
echo [5/5] 생성된 파일 확인...
if exist %TAR_FILE% (
    echo [OK] 파일: %TAR_FILE%
    for %%A in (%TAR_FILE%) do (
        set SIZE=%%~zA
    )
    echo [OK] 크기: %SIZE% bytes
    echo.
) else (
    echo [X] TAR 파일을 찾을 수 없습니다
    pause
    exit /b 1
)

REM 완료 메시지
echo =========================================
echo   [OK] 빌드 완료!
echo =========================================
echo.
echo 다음 단계:
echo 1. %TAR_FILE% 파일을 NAS로 업로드하세요
echo 2. NAS-CONTAINER-SETUP.md 가이드를 참고하여 설치하세요
echo.
echo 파일 위치: %CD%\%TAR_FILE%
echo.
pause
