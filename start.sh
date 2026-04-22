#!/bin/bash
echo "🚀 Starting HYROI ScorQ..."

# Kill any existing processes
pkill -f uvicorn 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start backend in background
echo "Starting backend on port 8000..."
cd /workspaces/smart-scorer/backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 3

# Update frontend env with correct URLs
SUPA_URL=$(grep "^SUPABASE_URL=" .env | cut -d= -f2)
SUPA_ANON=$(grep "^SUPABASE_ANON_KEY=" .env | cut -d= -f2)
cat > /workspaces/smart-scorer/frontend/.env.local << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=${SUPA_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPA_ANON}
NEXT_PUBLIC_API_URL=https://${CODESPACE_NAME}-8000.app.github.dev
ENVEOF
echo "✅ Frontend env updated"

# Start frontend
echo "Starting frontend on port 3000..."
cd /workspaces/smart-scorer/frontend
rm -rf .next
npm run dev

