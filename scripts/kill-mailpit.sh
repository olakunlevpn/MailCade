#!/bin/bash

# Kill any existing Mailpit processes
echo "🔍 Checking for running Mailpit processes..."

# Find and kill mailpit processes
PIDS=$(ps aux | grep '[m]ailpit' | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "✅ No Mailpit processes found running"
else
    echo "🛑 Found Mailpit process(es): $PIDS"
    echo "Killing processes..."
    echo "$PIDS" | xargs kill -9 2>/dev/null
    echo "✅ Mailpit processes killed"
fi

# Check if ports are still in use
echo ""
echo "📊 Checking ports..."
lsof -i :1025 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "⚠️  Port 1025 (SMTP) still in use:"
    lsof -i :1025
else
    echo "✅ Port 1025 (SMTP) is free"
fi

lsof -i :8025 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "⚠️  Port 8025 (API) still in use:"
    lsof -i :8025
else
    echo "✅ Port 8025 (API) is free"
fi

echo ""
echo "✅ Done! You can now start MailCade."
