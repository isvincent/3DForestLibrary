@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在啟動「森嶼書屋 · 心靈微光圖書館」本地網頁伺服器...
start "" "http://127.0.0.1:8080"
node "%~dp0server.mjs"
pause
