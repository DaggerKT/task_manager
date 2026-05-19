# Production Setup Guide for todo.sfcinema.com

## 📋 Prerequisites

Before deployment, ensure you have:

- Node.js 20+ LTS
- PostgreSQL 14+
- Nginx
- PM2 (for process management)
- SSL Certificate (Let's Encrypt)
- Domain: todo.sfcinema.com

---

## 🚀 Initial Setup

### 1. **Environment Configuration**

```bash
# Update .env.production with actual values
nano .env.production
```

Required variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/task_manager
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
```

### 2. **Install Dependencies**

```bash
pnpm install
pnpm build
```

### 3. **Database Setup**

```bash
# Run migrations
pnpm exec prisma migrate deploy

# Seed data (optional)
pnpm exec prisma db seed
```

---

## 🔧 Server Setup (Nginx)

### 1. **Copy Nginx Configuration**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/todo.sfcinema.com
sudo ln -s /etc/nginx/sites-available/todo.sfcinema.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. **SSL Certificate (Let's Encrypt)**

```bash
# First, comment out HTTPS in nginx.conf, then:
sudo certbot certonly --standalone -d todo.sfcinema.com -d www.todo.sfcinema.com

# After getting certificate, uncomment HTTPS in nginx.conf
sudo nginx -t
sudo systemctl restart nginx
```

### 3. **Auto-renewal**

```bash
# Certbot should handle this automatically
# But verify with:
sudo certbot renew --dry-run
```

---

## ⚙️ Application Startup (Using PM2)

### 1. **Install PM2**

```bash
npm install -g pm2
```

### 2. **Create PM2 Ecosystem Configuration**

Save as `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "todo-app",
      script: "./node_modules/.bin/next",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "realtime",
      script: "./realtime-server.cjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/realtime-error.log",
      out_file: "./logs/realtime-out.log",
    },
  ],
};
```

### 3. **Start Application**

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup on reboot
pm2 startup systemd -u $(whoami) --hp /home/$(whoami)
```

### 4. **Monitor**

```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# List processes
pm2 list
```

---

## 📦 Docker Deployment (Alternative)

### 1. **Build Image**

```bash
docker build -t todo-app:latest .
```

### 2. **Run Container**

```bash
docker run -d \
  --name todo-app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV="production" \
  --restart=always \
  todo-app:latest
```

---

## 🚀 Deployment

### Using Deploy Script

```bash
# Make script executable
chmod +x deploy-prod.sh

# Run deployment
sudo DOMAIN=todo.sfcinema.com ./deploy-prod.sh
```

### Manual Deployment

```bash
cd /path/to/project
git pull origin main
pnpm install
pnpm build
pm2 restart todo-app realtime
```

---

## 🛡️ Security Checklist

- ✅ Firewall configured (only 80, 443)
- ✅ SSH key authentication (no password)
- ✅ .env.production file protected (chmod 600)
- ✅ Database user with limited permissions
- ✅ SSL/TLS enabled
- ✅ Security headers in Nginx
- ✅ Fail2ban configured (optional)

---

## 📊 Monitoring

### Check Application Status

```bash
# PM2 status
pm2 list

# Check Nginx
systemctl status nginx
ps aux | grep nginx

# Monitor database
sudo -u postgres psql -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;"

# View logs
pm2 logs todo-app --lines 100
pm2 logs realtime --lines 100

# Nginx logs
tail -f /var/log/nginx/todo_sfcinemacity_access.log
tail -f /var/log/nginx/todo_sfcinemacity_error.log
```

### Performance Monitoring

```bash
# CPU/Memory usage
top

# Disk usage
df -h

# Network connections
ss -tlnp | grep 3000
```

---

## 🔄 Backup Strategy

```bash
# Database backup
pg_dump task_manager > backup_$(date +%Y%m%d).sql

# Restore database
psql task_manager < backup_20260506.sql

# Automated backup (add to crontab)
# 0 2 * * * pg_dump task_manager | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 🆘 Troubleshooting

### App not responding

```bash
# Check if running
pm2 list

# Restart
pm2 restart todo-app

# Check logs
pm2 logs todo-app --err
```

### Database connection error

```bash
# Test connection
psql -h localhost -U user -d task_manager

# Check environment variables
cat .env.production | grep DATABASE_URL
```

### Nginx issues

```bash
# Test configuration
sudo nginx -t

# Check syntax
grep -r "server_name" /etc/nginx/

# Restart
sudo systemctl restart nginx
```

### SSL certificate issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check Nginx SSL config
openssl s_client -connect todo.sfcinema.com:443
```

---

## 📞 Support

For issues or questions:
- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `/var/log/nginx/`
- Check system logs: `journalctl -xe`

---

**Last Updated:** May 6, 2026
