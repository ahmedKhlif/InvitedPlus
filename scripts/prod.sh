#!/bin/bash

# Production startup script

echo "🚀 Starting Invited+ in production mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Build and start production services
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

echo "✅ Production environment started!"
echo "🌐 Application: https://localhost"
echo "🔧 Backend API: https://localhost/api"
echo "📚 API Docs: https://localhost/api/docs"

# Show container status
echo "📊 Container status:"
docker-compose ps
