@echo off
REM Tablet/telefon icin: sunucuyu TUM yerel agda acar (ayni Wi-Fi'deki cihazlar baglanir).
REM DM yine bu bilgisayarin Claude planindan uretilir (ucretsiz).
cd /d "%~dp0"
set HOST=0.0.0.0
title Sonen Ocak - LAN Sunucu (tablet icin) - kapatma
echo ============================================================
echo  Sunucu tum Wi-Fi agina aciliyor.
echo  Asagida cikacak  http://192.168...:8787/  adresini
echo  TABLETIN tarayicisina yaz (PC ile AYNI Wi-Fi'de olmali).
echo  Windows "Erisime izin ver" derse ONAYLA.
echo  Bu pencereyi acik birak; kapatinca oyun durur.
echo ============================================================
echo.
node server.js
echo.
echo Sunucu durdu. Cikmak icin bir tusa bas.
pause >nul
