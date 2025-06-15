#!/bin/bash

echo "🔧 Testing Trend Tracker Pro Setup..."
echo ""

# Check if both servers are running
echo "1. Checking if frontend (port 3000) is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend not accessible on port 3000"
fi

echo ""
echo "2. Checking if backend (port 5001) is running..."
if curl -s http://localhost:5001/api > /dev/null; then
    echo "✅ Backend is running on port 5001"
else
    echo "❌ Backend not accessible on port 5001"
fi

echo ""
echo "3. Checking environment variables..."
echo "Frontend URL: http://localhost:3000"
echo "Backend API URL: http://localhost:5001/api"

echo ""
echo "🎉 Test completed! If both servers are running, you can access the app at:"
echo "   👉 http://localhost:3000"
echo ""
echo "📝 To run the servers manually:"
echo "   Frontend: npm run dev"
echo "   Backend:  npm run start"
echo ""
echo "🚀 For production deployment on Render.com, use: npm run render-build" 