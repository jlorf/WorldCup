#!/bin/bash
echo "Starting World Cup 2026 App..."
echo ""

# Start backend on port 3001
echo "Starting Backend on port 3001..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Start frontend on port 3000
echo "Starting Frontend on port 3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting!"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

# Handle Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for both processes
wait
