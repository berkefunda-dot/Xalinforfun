@echo off
REM Dedektiflik oyunu - sunucuyu baslatir + tarayicida acar (Claude planinla, ucretsiz)
cd /d "%~dp0"
title Sonen Ocak / Dedektif - Sunucu (kapatmak icin bu pencereyi kapat)
echo ============================================================
echo  Sunucu baslatiliyor... Tarayici 2 saniye icinde acilacak.
echo  OYNARKEN BU PENCEREYI ACIK BIRAK. Kapatinca oyun durur.
echo ============================================================
REM Tarayiciyi sunucu ayaga kalktiktan 2 sn sonra ac (arka planda)
start "" /b cmd /c "timeout /t 2 /nobreak >nul & explorer http://127.0.0.1:8787/"
node server.js
echo.
echo Sunucu durdu. Cikmak icin bir tusa bas.
pause >nul
