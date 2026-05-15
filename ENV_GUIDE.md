# Environment Variables Guide

## 📋 Overview

This project uses different environment configurations for different deployment scenarios.

---

## 🎯 Which `.env` file to use?

### Local Development (Docker Compose)
**File**: `.env.example` → Copy to `.env`

```bash
cp .env.example .env
# Edit with your local password
nano .env
```

**Usage**: `pnpm dev` (with Docker Compose)

---

### Production Server
**File**: `.env.production.example` → Copy to `.env.production`

```bash
cp .env.production.example .env.production
# Edit with actual server values
nano .env.production
```

**Usage**: `npm run start` (on production server)

---

## 📝 Configuration Reference

### `.env` (Local Development)
| Variable | Value | Purpose |
|----------|-------|---------|
| `POSTGRES_DB` | `taskmanager` | Docker database name |
| `POSTGRES_USER` | `postgres` | Docker database user |
| `POSTGRES_PASSWORD` | `<your_password>` | Docker database password |
| `DATABASE_URL` | `postgresql://postgres:<pass>@db:5432/taskmanager` | Docker network connection |
| `REALTIME_SERVER_URL` | `http://realtime:3001` | Docker network realtime |
| `NEXTAUTH_URL` | `http://localhost:3000` | Local auth callback |
| `NEXTAUTH_SECRET` | `<random-string>` | Session signing key |
| `NODE_ENV` | `development` | Development mode |

**Key Point**: Uses Docker hostnames (`db`, `realtime`)

---

### `.env.production` (Production Server)
| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/...` | Direct server connection |
| `NEXTAUTH_URL` | `https://<your-domain.com>` | HTTPS callback |
| `NEXTAUTH_SECRET` | `<random-string>` | Session signing key |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain.com>` | Public app URL |
| `NEXT_PUBLIC_API_URL` | `https://<your-domain.com>/api` | Public API URL |
| `REALTIME_SERVER_URL` | `ws://localhost:3001` | WebSocket connection |
| `NODE_ENV` | `production` | Production mode |

**Key Point**: Uses actual server hostnames/IPs

---

## 🔐 Generating NEXTAUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Example output:
```
/QqD8l9/jZv9xyxB/+YZqJ8mR0PjF5xN3v8Z+QlKp2k=
```

---

## 🚀 Development Workflow

```bash
# 1. Setup local .env
cp .env.example .env
nano .env  # Update password if needed

# 2. Start Docker Compose
docker compose up -d

# 3. Run development server
pnpm dev

# Open: http://localhost:3000
```

---

## 🔧 Production Deployment

```bash
# 1. Copy and configure production .env
cp .env.production.example .env.production
nano .env.production  # Update all values

# 2. Build application
pnpm build

# 3. Start with PM2
pm2 start ecosystem.config.js

# Access: https://<your-domain.com>
```

---

## ⚠️ Important Notes

### Local Development
- ✅ Can use default passwords (local only)
- ✅ Uses Docker network names
- ✅ HTTP is fine for development
- ✅ NEXTAUTH_SECRET can be simple (local only)

### Production
- ⚠️ **NEVER** hardcode secrets in .env.production
- ⚠️ **MUST** use strong NEXTAUTH_SECRET (32+ chars)
- ⚠️ **MUST** use HTTPS (required for NEXTAUTH)
- ⚠️ **MUST** use actual IP/hostname (not localhost)
- ⚠️ Protect `.env.production` file: `chmod 600 .env.production`
- ⚠️ Never commit `.env.production` to git (add to `.gitignore`)

---

## 🔒 Security Checklist

### Before Pushing to Git
```bash
# Ensure .env files are in .gitignore
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
echo ".env.production" >> .gitignore

# Verify
git status  # Should NOT show .env files
```

### Before Production Deploy
```bash
# 1. Set strong secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 2. Set correct URLs (use HTTPS)
NEXTAUTH_URL=https://<your-domain.com>

# 3. Update database URL
DATABASE_URL=postgresql://prod_user:strong_pass@prod_host:5432/task_manager_prod

# 4. Protect file permissions
chmod 600 .env.production

# 5. Verify no secrets in public files
grep -r "NEXTAUTH_SECRET" src/  # Should NOT appear
```

---

## 🐛 Troubleshooting

### Issue: `.env not found` in Docker
**Solution**: Make sure `.env` exists in root directory
```bash
ls -la .env
docker compose up -d --build
```

### Issue: Connection refused to `db` (Docker)
**Solution**: 
- Check Docker Compose is running: `docker compose ps`
- Check `DATABASE_URL` uses `db:5432` (not localhost)
- Restart: `docker compose restart`

### Issue: `NEXTAUTH_SECRET` undefined error
**Solution**: Generate and add to `.env` or `.env.production`
```bash
openssl rand -base64 32
# Then update NEXTAUTH_SECRET=<generated-value>
```

### Issue: Production says "Invalid callback URL"
**Solution**: 
- Verify `NEXTAUTH_URL` matches domain
- Verify HTTPS is enabled
- Verify Nginx is forwarding correctly

---

## 📚 Environment Variables Reference

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Full URL for auth redirects
- `NEXTAUTH_SECRET` - Random secret for session encryption

### Optional Variables
- `NEXT_PUBLIC_APP_URL` - Public app URL (defaults to NEXTAUTH_URL)
- `NEXT_PUBLIC_API_URL` - Public API URL
- `REALTIME_SERVER_URL` - WebSocket server URL
- `NODE_ENV` - `development` or `production`
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry

---

## 🔗 Related Files

- **Local Dev**: [.env.example](.env.example)
- **Production**: [.env.production.example](.env.production.example)
- **Next.js Config**: [next.config.ts](next.config.ts)
- **Docker Compose**: [docker-compose.yml](docker-compose.yml)
- **PM2 Config**: [ecosystem.config.js](ecosystem.config.js)

---

**Last Updated**: May 6, 2026
