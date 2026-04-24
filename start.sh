#!/bin/bash

# ============================================================
# AI School Safety & Threat Assessment - Startup Script
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     AI School Safety & Threat Assessment System         ║"
echo "║                   Starting Up...                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found! Please create it.${NC}"
    exit 1
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# ---- Clean up used ports ----
echo -e "\n${YELLOW}Cleaning up ports...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    echo -e "${GREEN}  ✓ Port $port is free${NC}"
}

cleanup_port $SERVER_PORT
cleanup_port $CLIENT_PORT

# ---- Check PostgreSQL ----
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
    if pg_isready -q 2>/dev/null; then
        echo -e "${GREEN}  ✓ PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
        if command -v brew &> /dev/null; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        fi
        sleep 2
        if pg_isready -q 2>/dev/null; then
            echo -e "${GREEN}  ✓ PostgreSQL started${NC}"
        else
            echo -e "${RED}  ✗ Could not start PostgreSQL. Please start it manually.${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}  pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Create database if not exists ----
echo -e "\n${YELLOW}Setting up database...${NC}"
DB_NAME="school_safety"
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${GREEN}  ✓ Database '$DB_NAME' exists${NC}"
else
    echo -e "${YELLOW}  Creating database '$DB_NAME'...${NC}"
    createdb $DB_NAME 2>/dev/null || psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Database '$DB_NAME' created${NC}"
fi

# ---- Install dependencies ----
echo -e "\n${YELLOW}Installing dependencies...${NC}"

echo -e "${BLUE}  Installing server dependencies...${NC}"
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}  ✓ Server dependencies installed${NC}"

echo -e "${BLUE}  Installing client dependencies...${NC}"
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}  ✓ Client dependencies installed${NC}"

cd "$PROJECT_DIR"

# ---- Seed database ----
echo -e "\n${YELLOW}Seeding database...${NC}"
cd "$PROJECT_DIR/server"
node seed.js
echo -e "${GREEN}  ✓ Database seeded with data${NC}"

cd "$PROJECT_DIR"

# ---- Start services ----
echo -e "\n${CYAN}Starting services...${NC}"

# Start backend with nodemon for hot reload
echo -e "${BLUE}  Starting backend server (port $SERVER_PORT)...${NC}"
cd "$PROJECT_DIR/server"
npx nodemon index.js &
SERVER_PID=$!
echo -e "${GREEN}  ✓ Backend server started (PID: $SERVER_PID)${NC}"

# Start frontend with Vite (has built-in HMR)
echo -e "${BLUE}  Starting frontend (port $CLIENT_PORT)...${NC}"
cd "$PROJECT_DIR/client"
npx vite --host &
CLIENT_PID=$!
echo -e "${GREEN}  ✓ Frontend started (PID: $CLIENT_PID)${NC}"

cd "$PROJECT_DIR"

# ---- Cleanup handler ----
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗"
echo "║              All Systems Running!                       ║"
echo "║                                                         ║"
echo "║  Frontend:  http://localhost:$CLIENT_PORT                    ║"
echo "║  Backend:   http://localhost:$SERVER_PORT                    ║"
echo "║                                                         ║"
echo "║  Login:     admin@school.edu / password123              ║"
echo "║                                                         ║"
echo "║  Press Ctrl+C to stop all services                      ║"
echo -e "╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for background processes
wait
