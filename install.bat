@echo off
setlocal enabledelayedexpansion
title Antigravity Japanese Localization Installer

echo ===================================================
echo   Antigravity 日本語化 Mod インストーラー
echo ===================================================
echo.

echo Antigravity を終了しています...
taskkill /F /IM Antigravity.exe > nul 2>&1
timeout /t 2 /nobreak > nul

echo.
echo パッチをビルド＆適用中...
cd /d "%~dp0"
node install-mod.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo  日本語化パッチの適用が正常に完了しました！
    echo  Antigravity を再起動します...
    echo ===================================================
    start "" "%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
) else (
    echo.
    echo ===================================================
    echo  [エラー] パッチの適用に失敗しました。
    echo ===================================================
)
echo.
pause
