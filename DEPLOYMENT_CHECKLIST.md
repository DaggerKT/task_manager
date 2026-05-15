# Deployment Configuration Summary

## ✅ Files Created/Updated for Production Deployment

### 1. Environment Configuration
- **`.env.production`** ✅
  - Production environment variables
  - Database URL, API URLs, authentication settings
  - **Action Required**: Update with actual values

- **`.env.production.example`** ✅
  - Template showing required variables
  - Reference for other developers

### 2. Application Configuration
- **`next.config.ts`** ✅ Updated
  - Added security headers
  - Optimized for production
  - Image optimization settings
  - API rewrites configuration

- **`package.json`** ✅ Updated
  - Added production scripts
  - `npm run start` - Start Next.js in production
  - `npm run start:server` - Start both app and realtime server
  - `npm run deploy` - Run deployment script

### 3. Process Management (PM2)
- **`ecosystem.config.js`** ✅
  - Cluster mode for Next.js app
  - Separate process for realtime server
  - Memory limits and auto-restart
  - Log configuration
  - Deploy configuration for PM2 Deploy

### 4. Web Server (Nginx)
- **`nginx.conf`** ✅
  - SSL/TLS configuration
  - HTTP → HTTPS redirect
  - WebSocket support for realtime
  - Gzip compression
  - Security headers
  - Static file caching
  - Upstream to Node.js app and realtime server

### 5. Containerization (Docker)
- **`Dockerfile`** ✅ (Already exists)
  - Multi-stage build
  - Optimized for production
  - Non-root user security

### 6. Deployment Automation
- **`deploy-prod.sh`** ✅ Updated
  - Git pull
  - Docker build + up
  - Database migration
  - Nginx configuration
  - SSL certificate issuance (optional when EMAIL is provided)

### 7. Documentation
- **`SETUP.md`** ✅
  - Complete setup guide
  - Prerequisites checklist
  - Step-by-step installation
  - Nginx configuration
  - SSL setup
  - PM2 management
  - Monitoring guide
  - Troubleshooting guide
  - Backup strategy

---

## 🚀 Quick Start for Server Setup

### 1. Copy Files to Server
```bash
scp -r .env .env.production deploy-prod.sh nginx.conf SETUP.md user@server:/path/to/project/
```

### 2. Run Initial Setup (on server)
```bash
cd /path/to/project

# Install PM2 globally
npm install -g pm2

# Install dependencies
pnpm install

# Setup database
pnpm exec prisma migrate deploy

# Build application
pnpm build

# Create logs directory
mkdir -p logs
```

### 3. Configure Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/<your-domain.com>
sudo ln -s /etc/nginx/sites-available/<your-domain.com> /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Setup SSL Certificate
```bash
sudo certbot certonly --standalone -d <your-domain.com> -d www.<your-domain.com>
sudo systemctl restart nginx
```

### 5. Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $(whoami) --hp /home/$(whoami)
```

### 6. Verify Setup
```bash
# Check PM2 status
pm2 list

# Check Nginx
sudo systemctl status nginx

# Check logs
pm2 logs
```

---

## 📋 Checklist Before Deployment

### DNS Configuration
- [ ] DNS A record points to server IP
- [ ] Domain resolves correctly: `nslookup <your-domain.com>`

### Environment Variables
- [ ] `.env.production` created with actual values
- [ ] Database URL is correct
- [ ] NEXTAUTH_SECRET is set (generated with: `openssl rand -base64 32`)
- [ ] API URLs point to correct domain

### Server Setup
- [ ] Node.js 20+ installed
- [ ] PostgreSQL 14+ running
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] Firewall allows ports 80, 443

### SSL Certificate
- [ ] Let's Encrypt certificate obtained
- [ ] Certificate paths correct in nginx.conf
- [ ] Auto-renewal configured (certbot)

### Application Setup
- [ ] Dependencies installed: `pnpm install`
- [ ] Database migrations run: `pnpm exec prisma migrate deploy`
- [ ] Application built: `pnpm build`
- [ ] PM2 ecosystem started: `pm2 start ecosystem.config.js`

### Monitoring
- [ ] PM2 monitoring active: `pm2 monit`
- [ ] Logs visible: `pm2 logs`
- [ ] Website accessible: `https://<your-domain.com>`

---

## 📊 Common Commands

### PM2 Management
```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop all

# Restart
pm2 restart all

# View logs
pm2 logs

# Monitor
pm2 monit

# List processes
pm2 list

# Delete process
pm2 delete todo-app
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Start
sudo systemctl start nginx

# Stop
sudo systemctl stop nginx

# Restart
sudo systemctl restart nginx

# View status
sudo systemctl status nginx

# Logs
tail -f /var/log/nginx/task_manager_access.log
tail -f /var/log/nginx/task_manager_error.log
```

### Database Management
```bash
# Connect to database
psql -h localhost -U user -d task_manager_prod

# Run migrations
pnpm exec prisma migrate deploy

# Generate Prisma client
pnpm exec prisma generate

# View database schema
pnpm exec prisma studio
```

### Deployment
```bash
# One-command deployment
sudo DOMAIN=<your-domain.com> ./deploy-prod.sh

# Rollback (if needed)
git revert HEAD
sudo DOMAIN=<your-domain.com> ./deploy-prod.sh
```

### Docker Disk Protection
```bash
# One-time: make scripts executable
chmod +x ./docker-cleanup.sh ./install-docker-cleanup-cron.sh

# Run cleanup immediately
./docker-cleanup.sh

# Install daily cleanup cron job (03:30)
./install-docker-cleanup-cron.sh

# Verify scheduled task
crontab -l
```

Notes:
- Container log rotation is configured in docker-compose.yml with max-size=10m and max-file=5.
- Cleanup script removes unused Docker images/build cache older than 7 days and stopped containers.

---

## 🆘 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: Database connection refused
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string in .env.production
grep DATABASE_URL .env.production
```

### Issue: Nginx not forwarding requests
```bash
# Check Nginx configuration
sudo nginx -t

# Check upstream resolution
cat /etc/nginx/sites-enabled/<your-domain.com> | grep upstream
```

### Issue: SSL certificate not working
```bash
# Check certificate
sudo certbot certificates

# Test SSL
openssl s_client -connect <your-domain.com>:443

# Renew certificate
sudo certbot renew --force-renewal
```

---

## 📞 Support & Documentation

- **Setup Guide**: See `SETUP.md`
- **PM2 Docs**: https://pm2.keymetrics.io/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **Let's Encrypt**: https://letsencrypt.org/

---

**Last Updated**: May 6, 2026
**Domain**: <your-domain.com>
**Environment**: Production
