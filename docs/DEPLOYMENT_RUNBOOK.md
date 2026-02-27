# GeoWraith Production Deployment Runbook

**Version:** 1.0  
**Last Updated:** 2026-02-27  
**Status:** Production Ready

> **Quick Links:** [README](../README.md) | [Architecture](../ARCHITECTURE.md) | [AGENTS](../AGENTS.md) | [Status](../STATUS.md)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Deployment Options](#deployment-options)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores (for ONNX inference) |
| RAM | 8 GB | 16+ GB |
| Storage | 10 GB | 50+ GB (for model cache) |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- Node.js 20.x or higher
- npm 10.x or higher
- Git
- (Optional) Docker 24.x+ for containerized deployment

### External Dependencies

None required for core functionality. System is fully local-first:
- No cloud APIs needed for inference
- No database required
- Optional: Map tile CDN for online mode

---

## Infrastructure Requirements

### Single-Server Deployment (Recommended for MVP)

```
┌─────────────────────────────────────────┐
│           Reverse Proxy                 │
│    (nginx/Caddy - handles SSL)          │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────┐         ┌────▼────┐
│Frontend│         │ Backend │
│ :3001  │         │  :8080  │
└────────┘         └─────────┘
```

### Required Ports

| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 80 | HTTP | TCP | Redirects to HTTPS |
| 443 | HTTPS | TCP | Production traffic |
| 8080 | Backend API | TCP | Internal only (via proxy) |
| 3001 | Frontend dev | TCP | Development only |

---

## Deployment Options

### Option 1: VPS/VM Deployment (Recommended)

**Platforms:** DigitalOcean, Linode, Vultr, AWS EC2, GCP Compute, Azure VMs

**Cost:** $20-50/month for recommended specs

**Pros:**
- Full control over environment
- Predictable costs
- Easy debugging

**Cons:**
- Manual server management
- Need to configure SSL

### Option 2: Container Deployment

**Platforms:** Docker Compose, Kubernetes, AWS ECS, GCP Cloud Run

**Pros:**
- Consistent environments
- Easy scaling
- Version control for infrastructure

**Cons:**
- Added complexity
- Higher resource overhead

### Option 3: Static Frontend + Serverless Backend (Not Recommended)

**Note:** GeoWraith requires significant compute for ONNX inference. Serverless functions (Lambda, Cloud Functions) may timeout or cost excessive cold-start time.

---

## Step-by-Step Deployment

### 1. Server Preparation

```bash
# Update system (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install git
sudo apt-get install -y git

# Create app directory
sudo mkdir -p /opt/geowraith
sudo chown $USER:$USER /opt/geowraith
cd /opt/geowraith
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-org/geowraith.git .

# Install frontend dependencies
cd /opt/geowraith
npm ci
npm run build

# Install backend dependencies
cd /opt/geowraith/backend
npm ci

# Build reference dataset (one-time, ~10 minutes)
npm run build:dataset

# Verify installation
npm run test
npm run lint
```

### 3. Environment Configuration

Create `/opt/geowraith/backend/.env`:

```bash
NODE_ENV=production
PORT=8080
GEOWRAITH_OFFLINE=0
CACHE_MAX_AGE_MS=86400000
```

Create `/opt/geowraith/.env`:

```bash
VITE_API_URL=/api
NODE_ENV=production
```

### 4. Process Management (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 config
cat > /opt/geowraith/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'geowraith-backend',
      cwd: '/opt/geowraith/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      max_memory_restart: '4G',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      log_file: '/var/log/geowraith/backend.log',
      error_file: '/var/log/geowraith/backend-error.log',
      out_file: '/var/log/geowraith/backend-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'geowraith-frontend',
      cwd: '/opt/geowraith',
      script: 'serve',
      args: '-s dist -l 3001',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: '/var/log/geowraith/frontend.log'
    }
  ]
};
EOF

# Create log directory
sudo mkdir -p /var/log/geowraith
sudo chown $USER:$USER /var/log/geowraith

# Build backend
cd /opt/geowraith/backend
npm run build

# Install serve for frontend
npm install -g serve

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Reverse Proxy (nginx)

```bash
# Install nginx
sudo apt-get install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/geowraith << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (use certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for inference
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/geowraith /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificates (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos -m your-email@example.com

# Auto-renewal is configured automatically
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://your-domain.com/health
# Expected: {"status":"ok","version":"0.2.0"}

# Frontend
curl -I https://your-domain.com
# Expected: HTTP 200

# API test
curl -X POST https://your-domain.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="}'
```

### 2. Log Verification

```bash
# Check PM2 logs
pm2 logs

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check application logs
tail -f /var/log/geowraith/backend.log
```

### 3. Performance Baseline

```bash
# Test inference latency
curl -w "@curl-format.txt" -o /dev/null -s \
  -X POST https://your-domain.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"..."}'

# Expected: <5s for first request (model load), <2s for subsequent
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Backend response time | >2s | >5s |
| Error rate | >1% | >5% |
| CPU usage | >70% | >90% |
| Memory usage | >80% | >95% |
| Disk usage | >80% | >95% |

### Basic Monitoring Script

```bash
# Create monitoring script
cat > /opt/geowraith/monitor.sh << 'EOF'
#!/bin/bash

HEALTH=$(curl -sf https://localhost:8080/health || echo "FAIL")
if [ "$HEALTH" = "FAIL" ]; then
    echo "$(date): Backend health check failed" >> /var/log/geowraith/alerts.log
    pm2 restart geowraith-backend
fi
EOF
chmod +x /opt/geowraith/monitor.sh

# Add to crontab (every minute)
echo "* * * * * /opt/geowraith/monitor.sh" | sudo crontab -
```

---

## Troubleshooting

### Issue: Backend Won't Start

```bash
# Check logs
pm2 logs geowraith-backend

# Verify model files exist
ls -la /opt/geowraith/backend/.cache/

# Test manually
cd /opt/geowraith/backend
node dist/index.js
```

### Issue: Out of Memory

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
pm2 restart geowraith-backend

# Or add to PM2 config:
# node_args: "--max-old-space-size=8192"
```

### Issue: Model Loading Fails

```bash
# Rebuild dataset
cd /opt/geowraith/backend
npm run build:dataset

# Check model downloads
ls -la ~/.cache/spacegeo/
```

### Issue: High Latency

- Check CPU usage: `htop`
- Consider upgrading to server with better single-core performance
- Enable model caching (enabled by default)

---

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous version
cd /opt/geowraith
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# Rebuild and restart
cd backend && npm run build
pm2 restart all
```

### Full Rollback

```bash
# Stop services
pm2 stop all

# Restore from backup (if configured)
# tar -xzf /backups/geowraith-$(date -d '1 day ago' +%Y%m%d).tar.gz -C /

# Or redeploy from known good state
git checkout main
git pull
npm ci && npm run build
cd backend && npm ci && npm run build
pm2 start all
```

---

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall enabled (ufw) - ports 22, 80, 443 only
- [ ] No sensitive data in environment variables
- [ ] Backend not exposed directly (only via nginx)
- [ ] Regular security updates automated
- [ ] Logs rotated to prevent disk fill

---

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Security updates | Weekly | `sudo apt update && sudo apt upgrade` |
| Log rotation | Daily | `sudo logrotate -f /etc/logrotate.d/nginx` |
| SSL renewal check | Daily | `sudo certbot renew --dry-run` |
| Health check | Continuous | Monitoring script |
| Full backup | Weekly | Custom backup script |

---

## Support Contacts

- **Technical Issues:** Create GitHub issue
- **Security Concerns:** security@your-domain.com
- **Emergency:** Page on-call engineer

---

## Zero-Cost Deployment Notes

For truly zero-cost deployment during development:
- Use GitHub Codespaces or GitPod
- Or local machine with ngrok for temporary public URLs
- Production deployment as documented requires ~$20-50/month VPS

---

**End of Runbook**
