#!/bin/bash

# Railway Backend Deployment Script
echo "🚀 Starting backend deployment..."

# Change to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Install dev dependencies needed for build
echo "🔧 Installing build dependencies..."
npm install --save-dev @nestjs/cli typescript

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
npx nest build

# Verify build output
echo "📁 Checking build output..."
ls -la dist/

echo "✅ Backend build completed successfully!"
