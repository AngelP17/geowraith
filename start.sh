#!/bin/bash

# GeoWraith Development Startup Script
# Starts both backend and frontend services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8080
FRONTEND_PORT=3001
BACKEND_DIR="backend"
FRONTEND_DIR="."

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}      GEOWRAITH DEV STARTER           ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    
    # Kill backend process
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi
    
    # Kill frontend process
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    fi
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT TERM

# Check if ports are already in use
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}Error: Port $port is already in use.${NC}"
        echo -e "${YELLOW}Stop the existing $name service or change the port.${NC}"
        exit 1
    fi
}

echo -e "${BLUE}Checking ports...${NC}"
check_port $BACKEND_PORT "backend"
check_port $FRONTEND_PORT "frontend"
echo -e "${GREEN}✓ Ports available${NC}"
echo ""

# Start Backend
echo -e "${BLUE}Starting Backend...${NC}"
cd "$BACKEND_DIR"
npm start > /tmp/geowraith-backend.log 2>&1 &
BACKEND_PID=$!
cd - > /dev/null

echo -e "${YELLOW}  Waiting for backend to warm up...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend ready (PID: $BACKEND_PID)${NC}"
        echo -e "${BLUE}  → http://localhost:$BACKEND_PORT/${NC}"
        break
    fi
    sleep 0.5
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        echo -e "${YELLOW}Check logs: /tmp/geowraith-backend.log${NC}"
        exit 1
    fi
done
echo ""

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/geowraith-frontend.log 2>&1 &
FRONTEND_PID=$!
cd - > /dev/null

echo -e "${YELLOW}  Waiting for frontend to start...${NC}"
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT/ 2>/dev/null | grep -q "200\|000"; then
        echo -e "${GREEN}✓ Frontend ready (PID: $FRONTEND_PID)${NC}"
        echo -e "${BLUE}  → http://localhost:$FRONTEND_PORT/${NC}"
        break
    fi
    sleep 0.5
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Frontend failed to start${NC}"
        echo -e "${YELLOW}Check logs: /tmp/geowraith-frontend.log${NC}"
        cleanup
        exit 1
    fi
done
echo ""

# Show status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}      ALL SERVICES RUNNING!             ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "🌐 ${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT/"
echo -e "🔧 ${BLUE}Backend:${NC}  http://localhost:$BACKEND_PORT/"
echo -e "📊 ${BLUE}Health:${NC}   http://localhost:$BACKEND_PORT/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Show live logs from backend until user interrupts
tail -f /tmp/geowraith-backend.log /tmp/geowraith-frontend.log 2>/dev/null &
TAIL_PID=$!

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true

# Cleanup
cleanup
