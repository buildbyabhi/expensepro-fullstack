@echo off
echo Starting Backend Server...
start cmd /k "cd server && npm start"

echo Starting Frontend Server...
start cmd /k "cd client && npm run dev"

echo Done! Servers are starting in separate windows.
pause
