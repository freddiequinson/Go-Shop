#!/bin/bash
# Quick setup script for DigitalOcean deployment

echo "🚀 GoShopGhana Deployment Setup"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Check if .gitignore exists
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Environment files
.env
.env.*
!.env.production.example

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.venv

# Node
node_modules/
.next/
out/
build/
dist/
.cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Logs
*.log
EOF
    echo "✅ .gitignore created"
fi

# Generate secure keys
echo ""
echo "🔐 Generating secure keys for production..."
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

echo ""
echo "📋 Your generated secure keys:"
echo "================================"
echo "SECRET_KEY=$SECRET_KEY"
echo "JWT_SECRET_KEY=$JWT_SECRET_KEY"
echo ""
echo "⚠️  SAVE THESE KEYS! You'll need them for deployment."
echo ""

# Check Docker installation
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    docker --version
else
    echo "⚠️  Docker is not installed. Install from: https://docs.docker.com/get-docker/"
fi

if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed"
    docker-compose --version
else
    echo "⚠️  Docker Compose is not installed"
fi

echo ""
echo "📚 Next Steps:"
echo "================================"
echo "1. Create GitHub repository and push code:"
echo "   git remote add origin https://github.com/yourusername/Go-Shop.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2. For App Platform (Recommended):"
echo "   - Go to: https://cloud.digitalocean.com/apps"
echo "   - Click 'Create App'"
echo "   - Connect your GitHub repository"
echo "   - Follow the guide in DEPLOYMENT_GUIDE.md"
echo ""
echo "3. For Docker Droplet:"
echo "   - Create a droplet with Docker"
echo "   - Follow the guide in DEPLOYMENT_GUIDE.md"
echo ""
echo "📖 Full guide: DEPLOYMENT_GUIDE.md"
echo ""
