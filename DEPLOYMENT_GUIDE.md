# GoShopGhana Deployment Guide - DigitalOcean

This guide covers deploying your GoShopGhana application to DigitalOcean with easy updates.

## 📋 Table of Contents
1. [Deployment Options](#deployment-options)
2. [Option 1: App Platform (Recommended)](#option-1-app-platform-recommended)
3. [Option 2: Docker Droplet](#option-2-docker-droplet)
4. [Post-Deployment Setup](#post-deployment-setup)

---

## 🚀 Deployment Options

### **Option 1: App Platform** (Recommended)
- ✅ Easiest setup and maintenance
- ✅ Automatic deployments from GitHub
- ✅ Managed database included
- ✅ Auto-scaling and SSL
- 💰 Cost: ~$12-25/month

### **Option 2: Docker Droplet**
- ✅ More control and customization
- ✅ Potentially cheaper (~$6-12/month)
- ⚠️ Requires more DevOps knowledge
- ⚠️ Manual server management

---

## Option 1: App Platform (RECOMMENDED)

### Prerequisites
1. GitHub account
2. DigitalOcean account
3. Push your code to GitHub repository

### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/Go-Shop.git
git branch -M main
git push -u origin main
```

### Step 2: Create App on DigitalOcean

1. **Go to DigitalOcean Dashboard**
   - Navigate to: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository**
   - Select "GitHub" as source
   - Authorize DigitalOcean
   - Select your `Go-Shop` repository
   - Choose `main` branch
   - Enable "Autodeploy" (updates on every push)

3. **Configure Backend Service**
   - **Name**: `goshop-backend`
   - **Source Directory**: `/backend`
   - **Dockerfile Path**: `/Dockerfile.backend`
   - **HTTP Port**: `8000`
   - **Health Check Path**: `/api/v1/health` (you'll need to add this endpoint)
   - **Instance Size**: Basic ($12/month)

4. **Configure Frontend Service**
   - **Name**: `goshop-frontend`
   - **Source Directory**: `/frontend`
   - **Dockerfile Path**: `/Dockerfile.frontend`
   - **HTTP Port**: `3000`
   - **Instance Size**: Basic ($12/month)

5. **Add Managed PostgreSQL Database**
   - Click "Add Resource" → "Database"
   - **Engine**: PostgreSQL 15
   - **Plan**: Basic ($15/month)
   - **Name**: `goshop-db`
   - Connection string will be auto-injected as `${db.DATABASE_URL}`

6. **Configure Environment Variables**

   **Backend Environment Variables:**
   ```
   DATABASE_URL=${db.DATABASE_URL}
   SECRET_KEY=<generate-secure-key>
   JWT_SECRET_KEY=<generate-secure-key>
   PAYSTACK_SECRET_KEY=<your-live-key>
   PAYSTACK_PUBLIC_KEY=<your-live-key>
   HUBTEL_CLIENT_ID=<your-hubtel-id>
   HUBTEL_CLIENT_SECRET=<your-hubtel-secret>
   HUBTEL_SENDER_ID=<your-sender-id>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=<your-email>
   SMTP_PASSWORD=<your-app-password>
   EMAILS_FROM_EMAIL=<your-email>
   EMAILS_FROM_NAME=Go-Shop Ghana
   GOOGLE_CLIENT_ID=<your-google-id>
   GOOGLE_CLIENT_SECRET=<your-google-secret>
   GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
   FACEBOOK_CLIENT_ID=<your-facebook-id>
   FACEBOOK_CLIENT_SECRET=<your-facebook-secret>
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/facebook/callback
   BACKEND_CORS_ORIGINS=["https://yourdomain.com"]
   ```

   **Frontend Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=${goshop-backend.PUBLIC_URL}
   ```

7. **Review and Launch**
   - Review configuration
   - Click "Create Resources"
   - Wait 5-10 minutes for deployment

### Step 3: Configure Custom Domain (Optional)

1. In App Platform, go to "Settings" → "Domains"
2. Add your custom domain (e.g., `goshopghana.com`)
3. Update DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: <your-app>.ondigitalocean.app
   ```
4. SSL certificate will be auto-provisioned

### Step 4: Update OAuth Redirect URIs

Update your OAuth provider settings with production URLs:
- **Google Console**: https://console.cloud.google.com/
- **Facebook Developers**: https://developers.facebook.com/

---

## Option 2: Docker Droplet

### Step 1: Create Droplet

1. **Create Droplet**
   - Go to: https://cloud.digitalocean.com/droplets
   - Click "Create Droplet"
   - **Image**: Docker on Ubuntu 22.04
   - **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU)
   - **Datacenter**: Choose closest to Ghana (London or Frankfurt)
   - **Authentication**: SSH keys (recommended)
   - **Hostname**: `goshop-server`

2. **Add Managed Database** (Optional but Recommended)
   - Create PostgreSQL database separately
   - Or use Docker PostgreSQL (less reliable)

### Step 2: Initial Server Setup

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Docker Compose
apt install docker-compose -y

# Create app directory
mkdir -p /opt/goshop
cd /opt/goshop
```

### Step 3: Setup GitHub Deploy Keys

```bash
# Generate SSH key for deployment
ssh-keygen -t ed25519 -C "deploy@goshop" -f ~/.ssh/goshop_deploy

# Display public key
cat ~/.ssh/goshop_deploy.pub
```

Add this key to your GitHub repository:
- Go to: Settings → Deploy keys → Add deploy key
- Paste the public key
- Enable "Allow write access" (for auto-updates)

### Step 4: Clone Repository

```bash
# Configure git to use deploy key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/goshop_deploy

# Clone repository
git clone git@github.com:yourusername/Go-Shop.git .
```

### Step 5: Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

Fill in all production values (database URL, API keys, etc.)

### Step 6: Deploy with Docker Compose

```bash
# Build and start containers
docker-compose --env-file .env.production up -d

# Check logs
docker-compose logs -f

# Verify services are running
docker-compose ps
```

### Step 7: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/goshop
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
# Enable site
ln -s /etc/nginx/sites-available/goshop /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

### Step 9: Setup Auto-Updates (Optional)

Create a deployment script:

```bash
nano /opt/goshop/deploy.sh
```

Add:

```bash
#!/bin/bash
cd /opt/goshop

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose --env-file .env.production down
docker-compose --env-file .env.production up -d --build

# Clean up old images
docker image prune -f

echo "Deployment completed at $(date)"
```

Make it executable:

```bash
chmod +x /opt/goshop/deploy.sh
```

Setup webhook for auto-deploy (optional):
- Use GitHub Actions or webhook service
- Trigger `/opt/goshop/deploy.sh` on push to main

---

## Post-Deployment Setup

### 1. Add Health Check Endpoint

Add to `backend/app/api/api_v1/api.py`:

```python
@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
```

### 2. Run Database Migrations

**App Platform:**
- Migrations run automatically via Dockerfile CMD

**Droplet:**
```bash
docker-compose exec backend alembic upgrade head
```

### 3. Create Admin User

```bash
# App Platform: Use console
# Droplet:
docker-compose exec backend python -c "
from app.core.database import SessionLocal
from app.crud.user import create_user
from app.schemas.user import UserCreate
from app.models.user import UserType

db = SessionLocal()
admin = UserCreate(
    email='admin@goshopghana.com',
    username='admin',
    full_name='Admin User',
    password='ChangeThisPassword123!',
    user_type=UserType.ADMIN
)
create_user(db, admin)
print('Admin user created!')
"
```

### 4. Seed Categories

```bash
# Run seeding script
docker-compose exec backend python seed_categories_hierarchical.py
```

### 5. Monitor Application

**App Platform:**
- Built-in monitoring dashboard
- View logs in real-time
- Set up alerts

**Droplet:**
```bash
# View logs
docker-compose logs -f

# Monitor resources
docker stats

# Check health
curl http://localhost:8000/api/v1/health
```

---

## 🔄 Updating Your Application

### App Platform (Automatic)
```bash
# Just push to GitHub
git add .
git commit -m "Update feature"
git push origin main

# App Platform auto-deploys in ~5 minutes
```

### Docker Droplet (Manual)
```bash
# SSH into server
ssh root@your_droplet_ip

# Run deployment script
cd /opt/goshop
./deploy.sh
```

---

## 💰 Cost Comparison

### App Platform
- Backend: $12/month
- Frontend: $12/month
- Database: $15/month
- **Total: ~$39/month**
- ✅ Zero maintenance
- ✅ Auto-scaling
- ✅ Managed backups

### Docker Droplet
- Droplet (2GB): $12/month
- Managed DB: $15/month
- **Total: ~$27/month**
- ⚠️ Requires maintenance
- ⚠️ Manual scaling
- ⚠️ Manual backups

---

## 🆘 Troubleshooting

### App Platform Issues

**Build fails:**
- Check build logs in dashboard
- Verify Dockerfile paths
- Ensure all dependencies in requirements.txt/package.json

**Database connection fails:**
- Verify `${db.DATABASE_URL}` is set
- Check database is in same region
- Review connection string format

**Frontend can't reach backend:**
- Verify `NEXT_PUBLIC_API_URL=${goshop-backend.PUBLIC_URL}`
- Check CORS settings in backend

### Droplet Issues

**Containers won't start:**
```bash
docker-compose logs
docker-compose ps
```

**Out of memory:**
```bash
# Upgrade droplet or add swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

**SSL certificate issues:**
```bash
certbot renew --dry-run
systemctl status certbot.timer
```

---

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## ✅ Recommended: App Platform

For your use case, **App Platform is the best choice** because:
1. ✅ Push to GitHub = automatic deployment
2. ✅ No server management required
3. ✅ Built-in monitoring and scaling
4. ✅ Managed database with backups
5. ✅ SSL certificates included
6. ✅ Easy rollbacks if something breaks

The extra $12/month is worth the time saved on DevOps!
