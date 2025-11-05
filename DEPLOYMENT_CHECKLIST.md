# 🚀 Deployment Checklist

Use this checklist to ensure a smooth deployment to DigitalOcean.

## Pre-Deployment

### 1. Code Preparation
- [ ] All code committed to Git
- [ ] `.gitignore` configured (excludes `.env`, `node_modules`, etc.)
- [ ] No sensitive data in code (API keys, passwords)
- [ ] All features tested locally

### 2. Environment Variables
- [ ] Generate new `SECRET_KEY` for production
- [ ] Generate new `JWT_SECRET_KEY` for production
- [ ] Update OAuth redirect URIs to production domain
- [ ] Get live Paystack keys (not test keys)
- [ ] Verify Hubtel credentials
- [ ] Setup production email (Gmail App Password or Brevo)

### 3. Database
- [ ] Backup local database (if migrating data)
- [ ] Export any seed data needed
- [ ] Document database schema

### 4. GitHub Setup
- [ ] Create GitHub repository
- [ ] Push code to `main` branch
- [ ] Enable branch protection (optional)
- [ ] Add collaborators (if team)

---

## Deployment (App Platform - Recommended)

### 1. Create App
- [ ] Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
- [ ] Click "Create App"
- [ ] Connect GitHub repository
- [ ] Select `main` branch
- [ ] Enable "Autodeploy"

### 2. Configure Backend Service
- [ ] Name: `goshop-backend`
- [ ] Source Directory: `/backend`
- [ ] Dockerfile: `/Dockerfile.backend`
- [ ] HTTP Port: `8000`
- [ ] Health Check: `/api/v1/health`
- [ ] Instance Size: Basic ($12/month minimum)

### 3. Configure Frontend Service
- [ ] Name: `goshop-frontend`
- [ ] Source Directory: `/frontend`
- [ ] Dockerfile: `/Dockerfile.frontend`
- [ ] HTTP Port: `3000`
- [ ] Instance Size: Basic ($12/month minimum)

### 4. Add Database
- [ ] Add PostgreSQL 15 database
- [ ] Plan: Basic ($15/month minimum)
- [ ] Name: `goshop-db`
- [ ] Note connection string variable: `${db.DATABASE_URL}`

### 5. Configure Environment Variables

#### Backend Variables
- [ ] `DATABASE_URL=${db.DATABASE_URL}`
- [ ] `SECRET_KEY=<your-generated-key>`
- [ ] `JWT_SECRET_KEY=<your-generated-key>`
- [ ] `PAYSTACK_SECRET_KEY=<live-key>`
- [ ] `PAYSTACK_PUBLIC_KEY=<live-key>`
- [ ] `HUBTEL_CLIENT_ID=<your-id>`
- [ ] `HUBTEL_CLIENT_SECRET=<your-secret>`
- [ ] `HUBTEL_SENDER_ID=<approved-sender>`
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER=<your-email>`
- [ ] `SMTP_PASSWORD=<app-password>`
- [ ] `EMAILS_FROM_EMAIL=<your-email>`
- [ ] `EMAILS_FROM_NAME=Go-Shop Ghana`
- [ ] `GOOGLE_CLIENT_ID=<your-id>`
- [ ] `GOOGLE_CLIENT_SECRET=<your-secret>`
- [ ] `GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback`
- [ ] `FACEBOOK_CLIENT_ID=<your-id>`
- [ ] `FACEBOOK_CLIENT_SECRET=<your-secret>`
- [ ] `FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/facebook/callback`
- [ ] `BACKEND_CORS_ORIGINS=["https://yourdomain.com"]`

#### Frontend Variables
- [ ] `NEXT_PUBLIC_API_URL=${goshop-backend.PUBLIC_URL}`

### 6. Launch
- [ ] Review all settings
- [ ] Click "Create Resources"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Check build logs for errors

---

## Post-Deployment

### 1. Verify Services
- [ ] Backend health check: `https://backend-url/api/v1/health`
- [ ] Frontend loads: `https://frontend-url`
- [ ] Database connected (check logs)

### 2. Configure Domain (Optional)
- [ ] Add custom domain in App Platform
- [ ] Update DNS records at registrar
- [ ] Wait for SSL certificate (auto-provisioned)
- [ ] Verify HTTPS works

### 3. Update OAuth Providers
- [ ] Update Google OAuth redirect URI
- [ ] Update Facebook OAuth redirect URI
- [ ] Test OAuth login flows

### 4. Database Setup
- [ ] Migrations run automatically (check logs)
- [ ] Create admin user (via console or script)
- [ ] Seed categories (run seed script)
- [ ] Import any initial data

### 5. Testing
- [ ] Test user registration
- [ ] Test email sending
- [ ] Test SMS sending (if configured)
- [ ] Test product creation
- [ ] Test order flow
- [ ] Test payment (Paystack)
- [ ] Test all major features

### 6. Monitoring
- [ ] Set up alerts in DigitalOcean
- [ ] Monitor error logs
- [ ] Check database performance
- [ ] Monitor API response times

---

## Ongoing Maintenance

### Updates
- [ ] Push to `main` branch triggers auto-deploy
- [ ] Monitor deployment status in dashboard
- [ ] Rollback if issues detected

### Backups
- [ ] Database backups enabled (automatic)
- [ ] Test restore procedure
- [ ] Document backup schedule

### Security
- [ ] Rotate secrets regularly
- [ ] Monitor for security updates
- [ ] Review access logs
- [ ] Keep dependencies updated

### Performance
- [ ] Monitor resource usage
- [ ] Scale up if needed
- [ ] Optimize slow queries
- [ ] Add caching if needed (Redis)

---

## Troubleshooting

### Build Fails
- [ ] Check build logs in dashboard
- [ ] Verify Dockerfile paths
- [ ] Ensure all dependencies listed
- [ ] Test Docker build locally

### Database Connection Issues
- [ ] Verify `DATABASE_URL` is set
- [ ] Check database is running
- [ ] Review connection string format
- [ ] Check firewall rules

### Frontend Can't Reach Backend
- [ ] Verify `NEXT_PUBLIC_API_URL` is correct
- [ ] Check CORS settings
- [ ] Test API endpoint directly
- [ ] Review network logs

### Email/SMS Not Sending
- [ ] Verify credentials in environment variables
- [ ] Check service quotas/limits
- [ ] Review error logs
- [ ] Test with simple script

---

## Cost Optimization

### Current Setup
- Backend: $12/month
- Frontend: $12/month
- Database: $15/month
- **Total: ~$39/month**

### Ways to Reduce Costs
- [ ] Use smaller instance sizes (if traffic is low)
- [ ] Combine services (single container)
- [ ] Use Docker Droplet instead (~$27/month)
- [ ] Optimize database queries (reduce DB size)

### Ways to Increase Performance
- [ ] Upgrade instance sizes
- [ ] Add Redis caching
- [ ] Enable CDN for static assets
- [ ] Add load balancer (for high traffic)

---

## Emergency Contacts

- **DigitalOcean Support**: https://www.digitalocean.com/support
- **Paystack Support**: support@paystack.com
- **Hubtel Support**: support@hubtel.com
- **GitHub Support**: https://support.github.com

---

## Success Criteria

Your deployment is successful when:
- ✅ Application is accessible via HTTPS
- ✅ Users can register and login
- ✅ Products display correctly
- ✅ Orders can be placed
- ✅ Payments process successfully
- ✅ Emails and SMS send correctly
- ✅ No errors in logs
- ✅ Performance is acceptable

---

**Need Help?** Refer to `DEPLOYMENT_GUIDE.md` for detailed instructions.
