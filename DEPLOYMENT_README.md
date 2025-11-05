# 🚀 Quick Deployment Guide - GoShopGhana

## TL;DR - Fastest Path to Production

### **Recommended: DigitalOcean App Platform**

**Why?** Push to GitHub = automatic deployment. Zero server management.

**Cost:** ~$39/month (Backend + Frontend + Database)

**Time to deploy:** 15-20 minutes

---

## 🎯 Quick Start (3 Steps)

### Step 1: Push to GitHub (5 min)

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/Go-Shop.git
git branch -M main
git push -u origin main
```

### Step 2: Create App on DigitalOcean (10 min)

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Connect your GitHub repository
4. Configure services:

**Backend:**
- Source: `/backend`
- Dockerfile: `/Dockerfile.backend`
- Port: `8000`
- Health check: `/api/v1/health`

**Frontend:**
- Source: `/frontend`
- Dockerfile: `/Dockerfile.frontend`
- Port: `3000`

**Database:**
- PostgreSQL 15
- Basic plan ($15/month)

### Step 3: Set Environment Variables (5 min)

**Backend:**
```bash
DATABASE_URL=${db.DATABASE_URL}
SECRET_KEY=<generate-with-openssl-rand-hex-32>
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
PAYSTACK_SECRET_KEY=<your-live-key>
PAYSTACK_PUBLIC_KEY=<your-live-key>
HUBTEL_CLIENT_ID=<your-id>
HUBTEL_CLIENT_SECRET=<your-secret>
SMTP_USER=<your-email>
SMTP_PASSWORD=<gmail-app-password>
NEXT_PUBLIC_API_URL=${goshop-backend.PUBLIC_URL}
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=${goshop-backend.PUBLIC_URL}
```

Click **"Create Resources"** and wait 5-10 minutes! ✨

---

## 🔄 How to Update (After Deployment)

```bash
# Make your changes
git add .
git commit -m "Update feature X"
git push origin main

# That's it! App Platform auto-deploys in ~5 minutes
```

---

## 📁 Files Created for Deployment

| File | Purpose |
|------|---------|
| `Dockerfile.backend` | Backend container configuration |
| `Dockerfile.frontend` | Frontend container configuration |
| `docker-compose.yml` | Local testing with Docker |
| `.dockerignore` | Files to exclude from Docker build |
| `.gitignore` | Files to exclude from Git |
| `.env.production.example` | Template for production env vars |
| `DEPLOYMENT_GUIDE.md` | Complete deployment instructions |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |
| `.github/workflows/deploy.yml` | Optional CI/CD pipeline |

---

## 🧪 Test Locally with Docker (Optional)

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 💰 Cost Breakdown

### App Platform (Recommended)
- **Backend**: $12/month (Basic)
- **Frontend**: $12/month (Basic)
- **Database**: $15/month (Basic)
- **Total**: ~$39/month

**Includes:**
- ✅ Automatic deployments
- ✅ SSL certificates
- ✅ Database backups
- ✅ Monitoring & alerts
- ✅ Auto-scaling
- ✅ Zero maintenance

### Docker Droplet (Alternative)
- **Droplet (2GB)**: $12/month
- **Managed DB**: $15/month
- **Total**: ~$27/month

**Requires:**
- ⚠️ Server management
- ⚠️ Manual deployments
- ⚠️ SSL setup
- ⚠️ Backup configuration

---

## 🔐 Generate Secure Keys

```bash
# SECRET_KEY
openssl rand -hex 32

# JWT_SECRET_KEY
openssl rand -hex 32
```

Save these for your environment variables!

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Backend health: `https://your-backend-url/api/v1/health`
- [ ] Frontend loads: `https://your-frontend-url`
- [ ] User registration works
- [ ] Email sending works
- [ ] SMS sending works (if configured)
- [ ] Payment processing works (Paystack)
- [ ] OAuth login works (Google/Facebook)

---

## 🆘 Common Issues

### Build Fails
**Problem:** Docker build errors

**Solution:**
1. Check build logs in DigitalOcean dashboard
2. Verify all files are committed to Git
3. Test locally: `docker-compose up --build`

### Database Connection Fails
**Problem:** Backend can't connect to database

**Solution:**
1. Verify `DATABASE_URL=${db.DATABASE_URL}` is set
2. Check database is in same region as app
3. Review connection logs

### Frontend Can't Reach Backend
**Problem:** API calls fail with CORS errors

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL=${goshop-backend.PUBLIC_URL}`
2. Check `BACKEND_CORS_ORIGINS` includes frontend URL
3. Test backend directly: `curl https://backend-url/api/v1/health`

---

## 📚 Documentation

- **Full Guide**: `DEPLOYMENT_GUIDE.md` - Complete instructions for both deployment options
- **Checklist**: `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment checklist
- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/

---

## 🎓 What You Get

### With App Platform:
1. **Push to GitHub** → Automatic deployment
2. **Managed database** → Automatic backups
3. **SSL certificates** → Automatic renewal
4. **Monitoring** → Built-in dashboards
5. **Scaling** → Automatic based on traffic
6. **Rollbacks** → One-click if issues occur

### Your Workflow:
```
Code locally → Commit → Push to GitHub → ☕ Coffee → Live!
```

---

## 🚀 Ready to Deploy?

1. **Quick Start**: Follow the 3 steps above
2. **Need Details?**: Read `DEPLOYMENT_GUIDE.md`
3. **Step-by-Step**: Use `DEPLOYMENT_CHECKLIST.md`

**Questions?** Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`

---

## 🎉 Success!

Once deployed, your GoShopGhana platform will be:
- ✅ Live on the internet
- ✅ Automatically updated on every push
- ✅ Backed up daily
- ✅ Secured with HTTPS
- ✅ Monitored 24/7

**Welcome to production!** 🇬🇭
