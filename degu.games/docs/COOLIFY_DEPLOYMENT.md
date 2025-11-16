# Complete Coolify Deployment Guide for DEGU

This guide will walk you through deploying the entire DEGU platform on Coolify, step by step.

## Prerequisites

- ✅ Coolify instance running (v4+)
- ✅ Domain names ready (e.g., `degu.games`, `api.degu.games`, `editor.degu.games`)
- ✅ GitHub repository with all code pushed
- ✅ Web3Auth credentials

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Your Domain                       │
│                   (degu.games)                       │
└─────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
    │    Web    │  │    API    │  │ Scratch   │
    │  Platform │  │  Server   │  │    GUI    │
    │  (Next.js)│  │ (Express) │  │  (React)  │
    │   :3001   │  │   :3000   │  │    :80    │
    └───────────┘  └─────┬─────┘  └───────────┘
                         │
                   ┌─────▼─────┐
                   │ PostgreSQL│
                   │ Database  │
                   │   :5432   │
                   └───────────┘
```

---

## Part 1: Database Setup (PostgreSQL)

### Step 1: Create PostgreSQL Database

1. **Log into Coolify Dashboard**
   - Navigate to your Coolify instance: `https://coolify.yourdomain.com`

2. **Create a New Database**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - **Name**: `degu-postgres`
   - **Version**: Choose `16-alpine` (recommended)
   - **Port**: Keep default `5432`

3. **Configure Database Settings**
   ```
   Database Name: degu_production
   Username: degu_user
   Password: [Generate strong password - save this!]
   ```

4. **Set Resource Limits** (adjust based on your server)
   ```
   Memory: 512MB minimum (1GB recommended)
   CPU: 1 core minimum
   ```

5. **Start the Database**
   - Click **"Deploy"**
   - Wait for status to show **"Running"**
   - Note the **internal connection URL**: `postgresql://degu_user:password@degu-postgres:5432/degu_production`

### Step 2: Enable External Access (Optional - for migrations)

- Click **"Settings"** → **"Network"**
- Enable **"Public Port"** if you need external access for development
- Note the public URL for later use

---

## Part 2: API Server Deployment

### Step 1: Create API Service

1. **Create New Application**
   - Click **"+ New"** → **"Application"**
   - **Name**: `degu-api`
   - **Source**: GitHub

2. **Connect GitHub Repository**
   - **Repository**: `https://github.com/0xPasho/degu.games`
   - **Branch**: `main` (or your production branch)
   - **Build Pack**: `Dockerfile`

3. **Configure Build Settings**
   - **Base Directory**: `/` (root)
   - **Dockerfile Location**: `/packages/api/Dockerfile`
   - **Docker Context**: `/` (important for monorepo)
   - **Build Command**: Leave empty (handled by Dockerfile)

### Step 2: Configure Environment Variables

Click **"Environment Variables"** and add:

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database (use internal URL)
DATABASE_URL=postgresql://degu_user:YOUR_PASSWORD@degu-postgres:5432/degu_production

# CORS Configuration (update with your domains)
CORS_ALLOWED_ORIGINS=https://degu.games,https://editor.degu.games

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_CHANGE_THIS
JWT_EXPIRES_IN=7d

# Web3Auth Configuration
WEB3AUTH_CLIENT_ID=your_web3auth_client_id_from_dashboard
WEB3AUTH_CLIENT_SECRET=your_web3auth_client_secret_from_dashboard
WEB3AUTH_JWKS_ENDPOINT=https://api-auth.web3auth.io/.well-known/jwks.json

# Optional: AI Features
FAL_KEY=your_fal_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
REMOVE_BG_API_KEY=your_remove_bg_api_key_here
```

### Step 3: Configure Networking

1. **Set Port Mapping**
   - **Internal Port**: `3000`
   - **External Port**: `80` or `443` (Coolify handles this)

2. **Add Custom Domain**
   - Click **"Domains"**
   - Add domain: `api.degu.games`
   - Enable **"Generate SSL Certificate"** (Let's Encrypt)

3. **Health Check**
   - **Path**: `/api/v1/health` (create this endpoint if it doesn't exist)
   - **Interval**: `30s`
   - **Timeout**: `10s`
   - **Retries**: `3`

### Step 4: Deploy API Server

1. Click **"Deploy"**
2. Monitor build logs
3. Wait for status: **"Running"**
4. Test endpoint: `https://api.degu.games/api/v1/health`

---

## Part 3: Web Platform Deployment (Next.js)

### Step 1: Create Web Service

1. **Create New Application**
   - Click **"+ New"** → **"Application"**
   - **Name**: `degu-web`
   - **Source**: Same GitHub repository

2. **Configure Build Settings**
   - **Repository**: `https://github.com/0xPasho/degu.games`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Base Directory**: `/`
   - **Dockerfile Location**: `/packages/web/Dockerfile`
   - **Docker Context**: `/`

### Step 2: Configure Build Arguments & Environment Variables

**Build Arguments** (used during build):
```bash
NEXT_PUBLIC_API_URL=https://api.degu.games/api/v1
NEXT_PUBLIC_SCRATCH_GUI_URL=https://editor.degu.games
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_mainnet
```

**Environment Variables** (runtime):
```bash
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0
```

### Step 3: Configure Networking

1. **Port Mapping**
   - **Internal Port**: `3001`

2. **Custom Domain**
   - Add: `degu.games` (main domain)
   - Add: `www.degu.games` (redirect to main)
   - Enable SSL for both

3. **Health Check**
   - **Path**: `/api/health`
   - **Interval**: `30s`

### Step 4: Deploy Web Platform

1. Click **"Deploy"**
2. Monitor build (may take 5-10 minutes)
3. Test: `https://degu.games`

---

## Part 4: Scratch GUI Deployment

### Step 1: Create Scratch GUI Service

1. **Create New Application**
   - **Name**: `degu-scratch-gui`
   - **Source**: Same GitHub repository

2. **Configure Build Settings**
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `/packages/scratch-gui/Dockerfile`
   - **Docker Context**: `/`

### Step 2: Configure Build Arguments

```bash
API_URL=https://api.degu.games/api/v1
```

### Step 3: Configure Networking

1. **Port Mapping**
   - **Internal Port**: `80` (nginx)

2. **Custom Domain**
   - Add: `editor.degu.games`
   - Enable SSL

3. **Health Check**
   - **Path**: `/health`
   - **Interval**: `30s`

### Step 4: Deploy Scratch GUI

1. Click **"Deploy"**
2. Monitor build
3. Test: `https://editor.degu.games`

---

## Part 5: Post-Deployment Configuration

### Step 1: Run Database Migrations

**Option A: Via Coolify Terminal**
1. Go to **API service** → **"Terminal"**
2. Run:
```bash
cd /app
npx prisma migrate deploy
npx prisma generate
```

**Option B: From Local Machine**
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://degu_user:password@your-coolify-ip:5432/degu_production"

cd packages/api
npx prisma migrate deploy
```

### Step 2: Verify All Services

Test each endpoint:

```bash
# API Health
curl https://api.degu.games/api/v1/health

# Web Platform
curl https://degu.games

# Scratch GUI
curl https://editor.degu.games/health
```

### Step 3: Configure DNS Records

Add these DNS records at your domain registrar:

```dns
Type    Name       Value                    TTL
A       @          your-coolify-ip          300
A       www        your-coolify-ip          300
A       api        your-coolify-ip          300
A       editor     your-coolify-ip          300
```

Or use Coolify's automatic DNS if available.

---

## Part 6: Environment-Specific Configuration

### Update CORS in API

After deployment, verify CORS settings match your domains:

```bash
# In Coolify API service environment variables
CORS_ALLOWED_ORIGINS=https://degu.games,https://www.degu.games,https://editor.degu.games
```

### Update Web3Auth Redirect URLs

1. Go to [Web3Auth Dashboard](https://dashboard.web3auth.io/)
2. Add redirect URLs:
   - `https://degu.games`
   - `https://www.degu.games`
   - `https://editor.degu.games`

---

## Part 7: Monitoring & Logs

### Access Service Logs

1. **In Coolify Dashboard**
   - Go to each service
   - Click **"Logs"**
   - Monitor in real-time

2. **Set Up Alerts** (if available)
   - Configure email notifications for:
     - Service down
     - High memory usage
     - Build failures

### Common Log Commands

```bash
# API Logs
# In Coolify Terminal for API service
tail -f /var/log/app.log

# Check Prisma connections
ps aux | grep prisma
```

---

## Part 8: Scaling & Optimization

### Horizontal Scaling

For high traffic, scale services:

1. **Database**
   - Upgrade to larger instance
   - Enable connection pooling
   - Consider read replicas

2. **API Server**
   - Increase replica count: `2-4 instances`
   - Add load balancer

3. **Web Platform**
   - Add CDN (Cloudflare)
   - Enable caching
   - Increase replicas

### Resource Optimization

**Recommended Resources per Service:**

```yaml
degu-postgres:
  memory: 1GB
  cpu: 1 core
  storage: 20GB

degu-api:
  memory: 512MB - 1GB
  cpu: 0.5 - 1 core
  replicas: 2

degu-web:
  memory: 512MB - 1GB
  cpu: 0.5 - 1 core
  replicas: 2

degu-scratch-gui:
  memory: 256MB - 512MB
  cpu: 0.25 - 0.5 core
  replicas: 1
```

---

## Part 9: Backup & Recovery

### Database Backups

1. **Enable Automatic Backups in Coolify**
   - Go to PostgreSQL service
   - **"Backups"** → Enable
   - **Frequency**: Daily
   - **Retention**: 7 days

2. **Manual Backup**
```bash
# SSH into Coolify server
docker exec degu-postgres pg_dump -U degu_user degu_production > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i degu-postgres psql -U degu_user degu_production < backup.sql
```

---

## Part 10: Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database is running
# In Coolify: degu-postgres status should be "Running"

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**2. Build Failures**
```bash
# Clear Docker cache in Coolify
# Rebuild with --no-cache flag

# Check Dockerfile syntax
docker build -f packages/api/Dockerfile .
```

**3. Memory Issues**
```bash
# Increase memory limit in Coolify
# Service → Settings → Resources → Memory: 1GB

# Check memory usage
docker stats degu-api
```

**4. SSL Certificate Issues**
```bash
# Regenerate certificate in Coolify
# Domains → Your domain → Regenerate SSL

# Check certificate expiry
echo | openssl s_client -servername degu.games -connect degu.games:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Part 11: CI/CD Setup

### Automatic Deployments

1. **In Coolify**
   - Go to each service
   - **"Settings"** → **"Build & Deploy"**
   - Enable **"Auto Deploy on Push"**
   - Select branch: `main`

2. **GitHub Webhook** (automatic)
   - Coolify creates webhook automatically
   - Pushes to `main` trigger deployment

### Deployment Pipeline

```mermaid
graph LR
    A[Push to GitHub] --> B[Coolify Webhook]
    B --> C[Build Docker Image]
    C --> D[Run Tests]
    D --> E{Tests Pass?}
    E -->|Yes| F[Deploy]
    E -->|No| G[Notify Failure]
    F --> H[Health Check]
    H --> I{Healthy?}
    I -->|Yes| J[Live]
    I -->|No| K[Rollback]
```

---

## Part 12: Security Checklist

- [ ] All services use HTTPS with valid SSL certificates
- [ ] Database is not exposed publicly (use internal network)
- [ ] Strong passwords for database (20+ characters)
- [ ] JWT secret is strong and unique (32+ characters)
- [ ] Environment variables are encrypted in Coolify
- [ ] CORS is configured with specific domains (no wildcards)
- [ ] Rate limiting enabled on API
- [ ] Regular security updates applied
- [ ] Backups are encrypted and tested
- [ ] Monitoring and alerting configured

---

## Quick Reference

### Service URLs
```
Web Platform:    https://degu.games
API:             https://api.degu.games
Scratch GUI:     https://editor.degu.games
Database:        degu-postgres:5432 (internal)
```

### Important Ports
```
API:             3000
Web:             3001
Scratch GUI:     80 (nginx)
PostgreSQL:      5432
```

### Key Commands
```bash
# Restart service (in Coolify)
# Service → Actions → Restart

# View logs
# Service → Logs → Real-time

# Run migrations
# API Service → Terminal
npx prisma migrate deploy

# Check service health
curl https://api.degu.games/api/v1/health
```

---

## Support

If you encounter issues:

1. Check Coolify documentation: https://coolify.io/docs
2. Review service logs in Coolify dashboard
3. Join Coolify Discord: https://coolify.io/discord
4. Contact DEGU support: support@degu.games

---

**Congratulations! Your DEGU platform is now live on Coolify! 🎉**

_Last updated: 2024_
