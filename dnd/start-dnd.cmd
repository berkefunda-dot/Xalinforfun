@echo off
REM D&D macerasi (Sonen Ocak) - sunucuyu baslatir + macera.html'i acar
cd /d "%~dp0"
title Sonen Ocak - D&D Sunucu (kapatmak icin bu pencereyi kapat)
echo ============================================================
echo  Sunucu baslatiliyor... D&D macerasi 2 saniye icinde acilacak.
echo  OYNARKEN BU PENCEREYI ACIK BIRAK. Kapatinca oyun durur.
echo ============================================================
start "" /b cmd /c "timeout /t 2 /nobreak >nul & explorer http://127.0.0.1:8787/macera.html"
node server.js
echo.
echo Sunucu durdu. Cikmak icin bir tusa bas.
pause >nul
