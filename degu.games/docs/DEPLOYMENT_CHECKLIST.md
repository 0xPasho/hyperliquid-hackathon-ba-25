# DEGU Coolify Deployment Checklist

Quick reference checklist for deploying DEGU on Coolify. Refer to `COOLIFY_DEPLOYMENT.md` for detailed instructions.

## Pre-Deployment Checklist

- [ ] Coolify instance is running (v4+)
- [ ] GitHub repository access configured
- [ ] Domain names ready:
  - `degu.games` (or your main domain)
  - `api.degu.games`
  - `editor.degu.games`
- [ ] Web3Auth credentials obtained
- [ ] Optional API keys ready (FAL, Gemini, Remove.bg)

## Environment Variables Prepared

### API Server
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET` (32+ characters)
- [ ] `WEB3AUTH_CLIENT_ID`
- [ ] `WEB3AUTH_CLIENT_SECRET`
- [ ] `CORS_ALLOWED_ORIGINS`
- [ ] Optional: `FAL_KEY`, `GEMINI_API_KEY`, `REMOVE_BG_API_KEY`

### Web Platform
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_SCRATCH_GUI_URL`
- [ ] `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
- [ ] `NEXT_PUBLIC_WEB3AUTH_NETWORK`

### Scratch GUI
- [ ] `API_URL` (build argument)

---

## Deployment Steps

### 1. Database Setup
- [ ] Create PostgreSQL database in Coolify
  - Name: `degu-postgres`
  - Version: `16-alpine`
  - Database: `degu_production`
  - User: `degu_user`
- [ ] Database is running
- [ ] Note internal connection URL
- [ ] Configure resource limits (1GB RAM recommended)

### 2. API Server Deployment
- [ ] Create new application: `degu-api`
- [ ] Configure GitHub repository
  - Branch: `main`
  - Build Pack: `Dockerfile`
  - Dockerfile Location: `/packages/api/Dockerfile`
  - Docker Context: `/`
- [ ] Add all environment variables
- [ ] Configure domain: `api.degu.games`
- [ ] Enable SSL certificate
- [ ] Set health check: `/api/v1/health`
- [ ] Deploy and verify running
- [ ] Test endpoint: `curl https://api.degu.games/api/v1/health`

### 3. Web Platform Deployment
- [ ] Create new application: `degu-web`
- [ ] Configure GitHub repository
  - Dockerfile Location: `/packages/web/Dockerfile`
  - Docker Context: `/`
- [ ] Add build arguments (NEXT_PUBLIC_* variables)
- [ ] Add runtime environment variables
- [ ] Configure domains:
  - `degu.games`
  - `www.degu.games` (optional)
- [ ] Enable SSL certificates
- [ ] Set health check: `/api/health`
- [ ] Deploy and verify
- [ ] Test: `curl https://degu.games`

### 4. Scratch GUI Deployment
- [ ] Create new application: `degu-scratch-gui`
- [ ] Configure GitHub repository
  - Dockerfile Location: `/packages/scratch-gui/Dockerfile`
  - Docker Context: `/`
- [ ] Add build argument: `API_URL`
- [ ] Configure domain: `editor.degu.games`
- [ ] Enable SSL certificate
- [ ] Set health check: `/health`
- [ ] Deploy and verify
- [ ] Test: `curl https://editor.degu.games/health`

### 5. Post-Deployment Tasks
- [ ] Run database migrations via API service terminal:
  ```bash
  cd /app
  npx prisma migrate deploy
  npx prisma generate
  ```
- [ ] Verify all services are running
- [ ] Test API health endpoint
- [ ] Test web platform loads
- [ ] Test editor loads
- [ ] Configure DNS records if needed

### 6. Web3Auth Configuration
- [ ] Go to Web3Auth Dashboard
- [ ] Add redirect URLs:
  - `https://degu.games`
  - `https://www.degu.games`
  - `https://editor.degu.games`
- [ ] Verify Web3Auth login works

### 7. Final Verification
- [ ] Test user registration/login
- [ ] Test project creation
- [ ] Test editor loading
- [ ] Test multiplayer rooms
- [ ] Verify all CORS settings working
- [ ] Check all services logs for errors
- [ ] Test from different browsers/devices

---

## DNS Configuration

Add these records at your domain registrar:

```
Type    Name       Value                TTL
A       @          [coolify-ip]        300
A       www        [coolify-ip]        300
A       api        [coolify-ip]        300
A       editor     [coolify-ip]        300
```

---

## Post-Deployment Optimization

### Optional Enhancements
- [ ] Enable automatic backups for PostgreSQL (daily, 7-day retention)
- [ ] Set up monitoring alerts
- [ ] Configure CI/CD auto-deploy on push
- [ ] Add CDN (Cloudflare) for static assets
- [ ] Scale services if needed (replicas: 2-4 for API/Web)
- [ ] Enable connection pooling for database
- [ ] Set up log aggregation

---

## Troubleshooting Quick Checks

If something isn't working:

1. **Check service status** - All services should show "Running" in Coolify
2. **Review logs** - Check each service's logs for errors
3. **Verify environment variables** - Ensure all required vars are set
4. **Test internal connectivity** - Database should be accessible from API
5. **Check CORS** - Ensure all domains are in CORS_ALLOWED_ORIGINS
6. **Verify DNS** - All domains should resolve to Coolify IP
7. **Check SSL** - All domains should have valid certificates
8. **Test migrations** - Run `npx prisma migrate status` in API terminal

---

## Service URLs Reference

```
Main Platform:   https://degu.games
API:            https://api.degu.games
Editor:         https://editor.degu.games
Database:       degu-postgres:5432 (internal only)
```

---

## Support Resources

- Coolify Docs: https://coolify.io/docs
- DEGU Deployment Guide: `COOLIFY_DEPLOYMENT.md`
- Coolify Discord: https://coolify.io/discord

---

**Last Updated**: 2024
