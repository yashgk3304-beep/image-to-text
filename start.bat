@echo off
rem Runs from whatever folder this file is in
cd /d "%~dp0"
start "" http://localhost:3000
node server.js
pause
