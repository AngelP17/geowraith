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
BACKEND_START_CMD="${BACKEND_START_CMD:-npm run dev}"
FRONTEND_START_CMD="${FRONTEND_START_CMD:-npm run dev}"
BACKEND_STARTUP_RETRIES="${BACKEND_STARTUP_RETRIES:-240}"
FRONTEND_STARTUP_RETRIES="${FRONTEND_STARTUP_RETRIES:-60}"
STARTUP_POLL_SECONDS="${STARTUP_POLL_SECONDS:-0.5}"
BACKEND_ALREADY_RUNNING=0
FRONTEND_ALREADY_RUNNING=0

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
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

echo -e "${BLUE}Checking ports...${NC}"
if check_port $BACKEND_PORT; then
    BACKEND_ALREADY_RUNNING=1
    echo -e "${YELLOW}  Port $BACKEND_PORT already in use. Reusing existing backend service.${NC}"
else
    echo -e "${GREEN}  Port $BACKEND_PORT available for backend.${NC}"
fi

if check_port $FRONTEND_PORT; then
    FRONTEND_ALREADY_RUNNING=1
    echo -e "${YELLOW}  Port $FRONTEND_PORT already in use. Reusing existing frontend service.${NC}"
else
    echo -e "${GREEN}  Port $FRONTEND_PORT available for frontend.${NC}"
fi
echo ""

# Start Backend
if [ "$BACKEND_ALREADY_RUNNING" -eq 0 ]; then
    echo -e "${BLUE}Starting Backend...${NC}"
    echo -e "${YELLOW}  Command: ${BACKEND_START_CMD}${NC}"
    cd "$BACKEND_DIR"
    bash -lc "$BACKEND_START_CMD" > /tmp/geowraith-backend.log 2>&1 &
    BACKEND_PID=$!
    cd - > /dev/null
else
    echo -e "${BLUE}Using existing Backend on port $BACKEND_PORT...${NC}"
fi

echo -e "${YELLOW}  Waiting for backend to warm up...${NC}"
for i in $(seq 1 "$BACKEND_STARTUP_RETRIES"); do
    if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        if [ "$BACKEND_ALREADY_RUNNING" -eq 0 ]; then
            echo -e "${GREEN}✓ Backend ready (PID: $BACKEND_PID)${NC}"
        else
            echo -e "${GREEN}✓ Backend already running on port $BACKEND_PORT${NC}"
        fi
        echo -e "${BLUE}  → http://localhost:$BACKEND_PORT/${NC}"
        break
    fi
    sleep "$STARTUP_POLL_SECONDS"
    if [ "$i" -eq "$BACKEND_STARTUP_RETRIES" ]; then
        echo -e "${RED}✗ Backend did not respond on /health${NC}"
        if [ "$BACKEND_ALREADY_RUNNING" -eq 0 ]; then
            echo -e "${YELLOW}Check logs: /tmp/geowraith-backend.log${NC}"
            tail -n 25 /tmp/geowraith-backend.log || true
        else
            echo -e "${YELLOW}Another process is bound to $BACKEND_PORT but is not GeoWraith backend.${NC}"
        fi
        exit 1
    fi
done
echo ""

# Start Frontend
if [ "$FRONTEND_ALREADY_RUNNING" -eq 0 ]; then
    echo -e "${BLUE}Starting Frontend...${NC}"
    echo -e "${YELLOW}  Command: ${FRONTEND_START_CMD}${NC}"
    cd "$FRONTEND_DIR"
    bash -lc "$FRONTEND_START_CMD" > /tmp/geowraith-frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd - > /dev/null
else
    echo -e "${BLUE}Using existing Frontend on port $FRONTEND_PORT...${NC}"
fi

echo -e "${YELLOW}  Waiting for frontend to start...${NC}"
for i in $(seq 1 "$FRONTEND_STARTUP_RETRIES"); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT/ \
        2>/dev/null | grep -q "200\|304"; then
        if [ "$FRONTEND_ALREADY_RUNNING" -eq 0 ]; then
            echo -e "${GREEN}✓ Frontend ready (PID: $FRONTEND_PID)${NC}"
        else
            echo -e "${GREEN}✓ Frontend already running on port $FRONTEND_PORT${NC}"
        fi
        echo -e "${BLUE}  → http://localhost:$FRONTEND_PORT/${NC}"
        break
    fi
    sleep "$STARTUP_POLL_SECONDS"
    if [ "$i" -eq "$FRONTEND_STARTUP_RETRIES" ]; then
        echo -e "${RED}✗ Frontend did not respond${NC}"
        if [ "$FRONTEND_ALREADY_RUNNING" -eq 0 ]; then
            echo -e "${YELLOW}Check logs: /tmp/geowraith-frontend.log${NC}"
            cleanup
        else
            echo -e "${YELLOW}Another process is bound to $FRONTEND_PORT but is not serving the app.${NC}"
        fi
        exit 1
    fi
done
echo ""

# Show status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}      ALL SERVICES RUNNING!             ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT/"
echo -e "${BLUE}Backend:${NC}  http://localhost:$BACKEND_PORT/"
echo -e "${BLUE}Health:${NC}   http://localhost:$BACKEND_PORT/health"
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
