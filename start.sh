#!/bin/bash
# Start D.I.Y.A - both frontend and backend

echo "Starting D.I.Y.A backend..."
cd server && node server.js &
BACKEND_PID=$!

echo "Starting D.I.Y.A frontend..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo ""
echo "D.I.Y.A is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "To enable AI features, add your Anthropic API key to server/.env:"
echo "  ANTHROPIC_API_KEY=sk-ant-..."
echo ""
echo "Press Ctrl+C to stop both servers."

wait
