#!/bin/bash

# Frontend Deployment Script for Vercel
set -e

echo "🚀 Starting frontend deployment to Vercel..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

echo "📋 Checking environment variables..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_API_URL not set"
    echo "   You'll need to set this in Vercel dashboard"
fi

if [ -z "$NEXT_PUBLIC_SOCKET_URL" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_SOCKET_URL not set"
    echo "   You'll need to set this in Vercel dashboard"
fi

echo "🔧 Installing dependencies..."
npm install

echo "🏗️  Building application..."
npm run build

echo "🚀 Deploying to Vercel..."

# Deploy to Vercel
if [ "$1" = "--prod" ]; then
    echo "📦 Deploying to production..."
    vercel --prod
else
    echo "🔍 Deploying preview..."
    vercel
fi

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Configure custom domain (optional)"
echo "3. Test all features in production"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
