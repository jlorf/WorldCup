#!/bin/bash
echo "Starting World Cup 2026 App in background..."
echo ""

# Start backend on port 3001
echo "Starting Backend on port 3001..."
nohup bash -c "cd backend && npm run dev" > backend.log 2>&1 &
echo "Backend PID: $!"

# Start frontend on port 3000
echo "Starting Frontend on port 3000..."
nohup bash -c "cd frontend && npm run dev" > frontend.log 2>&1 &
echo "Frontend PID: $!"

echo ""
echo "Both servers running in background!"
echo "Backend:  http://localhost:3001  (logs: backend.log)"
echo "Frontend: http://localhost:3000  (logs: frontend.log)"
