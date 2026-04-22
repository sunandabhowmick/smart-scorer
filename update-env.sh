#!/bin/bash
FRONTEND_PORT=3000
BACKEND_PORT=8000

# Get Codespaces name from hostname
CODESPACE=$(echo $CODESPACE_NAME 2>/dev/null || hostname)

echo "Updating .env.local with current Codespaces URLs..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://${CODESPACE_NAME}-${BACKEND_PORT}.app.github.dev|g" \
  /workspaces/smart-scorer/frontend/.env.local

echo "Done:"
cat /workspaces/smart-scorer/frontend/.env.local | grep API_URL
