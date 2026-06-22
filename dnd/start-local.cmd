@echo off
REM Sisli Fener Konagi - yerel sunucuyu baslatir (Claude planinla, ucretsiz DM)
cd /d "%~dp0"
echo Sunucu baslatiliyor... Tarayicida http://127.0.0.1:8787/ acilacak.
start "" http://127.0.0.1:8787/
node server.js
pause
