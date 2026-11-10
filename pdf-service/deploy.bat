@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM  pdf-service - atajos para el servidor Ubuntu
REM
REM  Requiere el cliente OpenSSH de Windows (ssh.exe / scp.exe), que ya viene
REM  instalado en Windows 10/11. Usa tu clave SSH tal cual la tenes
REM  configurada hoy - no guarda ninguna contrasena.
REM
REM  Si "Abrir sesion SSH" (opcion 5) no conecta, ese es el primer chequeo:
REM  arregla SSH_HOST abajo antes de tocar el resto.
REM ============================================================================
set SSH_HOST=diago@lacostasrl
set REMOTE_DIR=/home/diago/docker/pdf-service
set LOCAL_DIR=%~dp0
REM ============================================================================

:menu
cls
echo ============================================================
echo   pdf-service  -  %SSH_HOST%
echo ============================================================
echo.
echo   1. Deploy (copiar archivos + rebuild)
echo   2. Ver logs en vivo
echo   3. Reiniciar contenedor (sin rebuild)
echo   4. Chequear procesos zombie
echo   5. Abrir sesion SSH
echo   6. Salir
echo.
set /p opt="Elegi una opcion: "

if "%opt%"=="1" goto deploy
if "%opt%"=="2" goto logs
if "%opt%"=="3" goto restart
if "%opt%"=="4" goto zombies
if "%opt%"=="5" goto sshsession
if "%opt%"=="6" exit /b 0
goto menu

:deploy
echo.
echo Copiando server.js, docker-compose.yml, Dockerfile, package.json...
scp "%LOCAL_DIR%server.js" "%LOCAL_DIR%docker-compose.yml" "%LOCAL_DIR%Dockerfile" "%LOCAL_DIR%package.json" %SSH_HOST%:%REMOTE_DIR%/
if errorlevel 1 (
  echo.
  echo ERROR: fallo la copia. Revisa la conexion SSH ^(opcion 5^).
  pause
  goto menu
)
echo.
echo Reconstruyendo el contenedor...
ssh %SSH_HOST% "cd %REMOTE_DIR% && docker compose up -d --build"
echo.
echo Listo. Verificando que el contenedor este corriendo...
ssh %SSH_HOST% "cd %REMOTE_DIR% && docker compose ps"
echo.
pause
goto menu

:logs
echo.
echo Mostrando logs en vivo - Ctrl+C para volver al menu.
echo.
ssh %SSH_HOST% "cd %REMOTE_DIR% && docker compose logs -f --tail=100 pdf-service"
goto menu

:restart
echo.
ssh %SSH_HOST% "cd %REMOTE_DIR% && docker compose up -d"
echo.
pause
goto menu

:zombies
echo.
ssh %SSH_HOST% "ps -eo pid,ppid,stat,comm | grep Z || echo Sin zombies."
echo.
pause
goto menu

:sshsession
ssh %SSH_HOST%
goto menu
