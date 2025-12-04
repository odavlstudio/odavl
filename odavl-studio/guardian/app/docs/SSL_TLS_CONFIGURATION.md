# SSL/TLS Configuration for Guardian

Week 11: Production Deployment - HTTPS Setup

This document provides comprehensive SSL/TLS configuration for Guardian application.

## Overview

Guardian requires HTTPS for production deployment to ensure secure communication between clients and servers.

**Security Requirements:**

- TLS 1.2+ only (TLS 1.0/1.1 disabled)
- Strong cipher suites
- HSTS (HTTP Strict Transport Security)
- Certificate pinning (optional)
- OCSP stapling
- Perfect forward secrecy (PFS)

---

## Option 1: Nginx Reverse Proxy (Recommended)

### Architecture

```
Client → Nginx (HTTPS:443) → Guardian (HTTP:3000)
```

### Nginx Configuration

**File: `/etc/nginx/sites-available/guardian`**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name guardian.example.com;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name guardian.example.com;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/guardian.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/guardian.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/guardian.example.com/chain.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL Session
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy Settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
    
    # Health check endpoint (no auth required)
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
    
    # Access logs
    access_log /var/log/nginx/guardian_access.log;
    error_log /var/log/nginx/guardian_error.log;
}
```

### Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/guardian /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Option 2: Let's Encrypt with Certbot

### Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Obtain Certificate

```bash
# Interactive mode
sudo certbot --nginx -d guardian.example.com

# Non-interactive mode
sudo certbot --nginx \
  -d guardian.example.com \
  --non-interactive \
  --agree-tos \
  --email admin@example.com \
  --redirect
```

### Auto-Renewal

Certbot automatically configures renewal. Verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer (systemd)
sudo systemctl status certbot.timer

# Manual renewal
sudo certbot renew
```

---

## Option 3: Docker with Nginx + Certbot

### Docker Compose Configuration

**File: `docker-compose.ssl.yml`**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: guardian-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - guardian
    networks:
      - guardian-network

  certbot:
    image: certbot/certbot
    container_name: guardian-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - guardian-network

  guardian:
    build: .
    container_name: guardian-app
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      - postgres
      - redis
    networks:
      - guardian-network

  postgres:
    image: postgres:15-alpine
    container_name: guardian-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: guardian
      POSTGRES_USER: guardian
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - guardian-network

  redis:
    image: redis:7-alpine
    container_name: guardian-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - guardian-network

volumes:
  postgres_data:
  redis_data:

networks:
  guardian-network:
    driver: bridge
```

### Initial Certificate Obtention

```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Get certificate
docker-compose -f docker-compose.ssl.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d guardian.example.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email
```

---

## Option 4: Cloudflare SSL (Easiest)

### Setup Steps

1. **Add Domain to Cloudflare**
   - Sign up at cloudflare.com
   - Add your domain
   - Update nameservers

2. **Configure SSL/TLS Mode**
   - Go to SSL/TLS → Overview
   - Set to "Full (strict)" mode

3. **Generate Origin Certificate**
   - Go to SSL/TLS → Origin Server
   - Click "Create Certificate"
   - Copy certificate and private key

4. **Install Origin Certificate**

```bash
# Save certificate
sudo nano /etc/ssl/certs/cloudflare-origin.pem
# Paste certificate

# Save private key
sudo nano /etc/ssl/private/cloudflare-origin.key
# Paste private key

# Set permissions
sudo chmod 644 /etc/ssl/certs/cloudflare-origin.pem
sudo chmod 600 /etc/ssl/private/cloudflare-origin.key
```

5. **Update Nginx Config**

```nginx
ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
```

6. **Enable Cloudflare Features**
   - Always Use HTTPS: ON
   - Automatic HTTPS Rewrites: ON
   - HSTS: Enable with preload
   - TLS 1.3: ON
   - Minimum TLS Version: 1.2

---

## Testing SSL/TLS Configuration

### SSL Labs Test

```bash
# Online test
https://www.ssllabs.com/ssltest/analyze.html?d=guardian.example.com
```

**Target Score: A+**

### Command-Line Tests

```bash
# Test TLS 1.2
openssl s_client -connect guardian.example.com:443 -tls1_2

# Test TLS 1.3
openssl s_client -connect guardian.example.com:443 -tls1_3

# Verify certificate
openssl s_client -connect guardian.example.com:443 -showcerts

# Check cipher suites
nmap --script ssl-enum-ciphers -p 443 guardian.example.com

# Test HSTS
curl -I https://guardian.example.com | grep -i strict
```

### Automated Security Scan

```bash
# testssl.sh (comprehensive TLS test)
git clone https://github.com/drwetter/testssl.sh.git
cd testssl.sh
./testssl.sh https://guardian.example.com
```

---

## Certificate Management

### Certificate Renewal Script

**File: `scripts/renew-certificates.sh`**

```bash
#!/bin/bash

# Renew Let's Encrypt certificates
sudo certbot renew --quiet

# Reload Nginx
sudo systemctl reload nginx

# Log renewal
echo "$(date): Certificates renewed" >> /var/log/guardian/cert-renewal.log
```

### Cron Job for Auto-Renewal

```bash
# Edit crontab
sudo crontab -e

# Add renewal job (runs twice daily)
0 0,12 * * * /path/to/scripts/renew-certificates.sh
```

---

## HSTS Preload List

To include your domain in browser HSTS preload lists:

1. **Set HSTS header correctly:**

   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```

2. **Submit to HSTS preload list:**
   - Visit: https://hstspreload.org/
   - Enter your domain
   - Click "Submit"

3. **Wait for inclusion** (can take months)

---

## Troubleshooting

### Common Issues

**Issue: Certificate verification failed**

```bash
# Check certificate chain
openssl s_client -connect guardian.example.com:443 -showcerts

# Verify intermediate certificates
curl https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem.txt > intermediate.pem
cat fullchain.pem intermediate.pem > combined.pem
```

**Issue: Mixed content warnings**

- Ensure all resources load via HTTPS
- Check `Content-Security-Policy` header
- Use relative URLs or HTTPS for all assets

**Issue: WebSocket connection fails**

- Verify Nginx proxy settings
- Check `Upgrade` and `Connection` headers
- Ensure timeout values are sufficient

---

## Security Best Practices

### Certificate Storage

```bash
# Set proper permissions
sudo chmod 644 /etc/letsencrypt/live/guardian.example.com/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/guardian.example.com/privkey.pem
sudo chown root:root /etc/letsencrypt/live/guardian.example.com/*
```

### Monitoring Certificate Expiry

**Script: `scripts/check-certificate-expiry.sh`**

```bash
#!/bin/bash

DOMAIN="guardian.example.com"
THRESHOLD_DAYS=30

# Get certificate expiry date
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)

# Convert to epoch
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)

# Calculate days remaining
DAYS_REMAINING=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_REMAINING -lt $THRESHOLD_DAYS ]; then
    echo "⚠️  WARNING: Certificate expires in $DAYS_REMAINING days!"
    # Send alert (e.g., to Slack)
    curl -X POST $SLACK_WEBHOOK_URL -d "{\"text\": \"Certificate for $DOMAIN expires in $DAYS_REMAINING days!\"}"
else
    echo "✓ Certificate valid for $DAYS_REMAINING days"
fi
```

---

## Production Checklist

- [ ] TLS 1.2+ enabled, TLS 1.0/1.1 disabled
- [ ] Strong cipher suites configured
- [ ] HSTS header with preload
- [ ] OCSP stapling enabled
- [ ] Certificate auto-renewal configured
- [ ] Certificate expiry monitoring in place
- [ ] SSL Labs score A or A+
- [ ] Mixed content warnings resolved
- [ ] WebSocket over HTTPS working
- [ ] Backup certificates stored securely
- [ ] Certificate renewal tested
- [ ] Nginx security headers configured
- [ ] HTTP to HTTPS redirect working
- [ ] Health check endpoint accessible

---

## References

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [Cloudflare SSL Documentation](https://developers.cloudflare.com/ssl/)
- [Nginx SSL/TLS Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
