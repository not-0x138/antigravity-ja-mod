@echo off
setlocal enabledelayedexpansion
title Antigravity Japanese Localization Uninstaller

echo ===================================================
echo   Antigravity 日本語化 Mod アンインストーラー
echo ===================================================
echo.

echo Antigravity を終了しています...
taskkill /F /IM Antigravity.exe > nul 2>&1
timeout /t 2 /nobreak > nul

echo.
echo バックアップから復元中...
cd /d "%~dp0"
node restore-mod.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo  元の英語バージョンへの復元が完了しました！
    echo  Antigravity を起動します...
    echo ===================================================
    powershell -NoProfile -Command "Start-Process '%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe'"
    timeout /t 2 /nobreak > nul
    exit /b 0
) else (
    echo.
    echo ===================================================
    echo  [エラー] 復元に失敗しました。
    echo ===================================================
    pause
)
