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
    echo  Antigravity を再起動します...
    echo ===================================================
    start "" "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
) else (
    echo.
    echo ===================================================
    echo  [エラー] 復元に失敗しました。
    echo ===================================================
)
echo.
pause
