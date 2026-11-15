@echo off
title Smart Parking - Local Browser
cls
echo =====================================================================
echo           SMART PARKING SYSTEM - BROWSER LOKAL
echo =====================================================================
echo.

set PHP_PATH=C:\xampp\php\php.exe
if not exist "%PHP_PATH%" (
    echo [ERROR] PHP tidak ditemukan di C:\xampp\php\php.exe.
    echo Pastikan XAMPP telah terpasang dengan benar.
    pause
    exit /b 1
)

if not exist "%~dp0backend\.env" (
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
)
if not exist "%~dp0backend\database\database.sqlite" (
    type nul > "%~dp0backend\database\database.sqlite"
)

pushd "%~dp0backend"
"%PHP_PATH%" artisan config:clear --no-ansi >nul
findstr /r /c:"^APP_KEY=." ".env" >nul
if errorlevel 1 (
    "%PHP_PATH%" artisan key:generate --force --no-ansi
    if errorlevel 1 (
        echo [ERROR] APP_KEY Laravel gagal dibuat.
        popd
        pause
        exit /b 1
    )
)

"%PHP_PATH%" artisan migrate --force --no-ansi
if errorlevel 1 (
    echo [ERROR] Migrasi SQLite gagal. Periksa konfigurasi backend\.env.
    popd
    pause
    exit /b 1
)

echo Menjalankan Laravel API pada 127.0.0.1:8000...
start "Smart Parking - Laravel API" "%PHP_PATH%" artisan serve --host=0.0.0.0 --port=8000
popd

echo Menjalankan frontend lokal pada 127.0.0.1:3000...
start "Smart Parking - Frontend Lokal" "%PHP_PATH%" -S 0.0.0.0:3000 -t "%~dp0"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:3000"

echo.
echo =====================================================================
echo APLIKASI SIAP DI BROWSER INI
echo =====================================================================
echo  - Alamat lokal: http://127.0.0.1:3000
echo  - Database SQLite dan Laravel API: http://127.0.0.1:8000
echo  - Bukti pembayaran disimpan sebagai file di backend.
echo  - ESP32 tetap dijalankan dan dikonfigurasi terpisah.
echo =====================================================================
echo.
pause
