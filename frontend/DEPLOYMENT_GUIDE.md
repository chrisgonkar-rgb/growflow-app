# Growflow Deployment Guide
## Custom Domain Setup for truenorthgroupltd.com

© TrueNorth Group of Companies Ltd. All rights reserved.

---

## Table of Contents

1. [Overview](#overview)
2. [Domain DNS Configuration](#domain-dns-configuration)
3. [Hosting Options](#hosting-options)
4. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [File Storage Setup](#file-storage-setup)
8. [Step-by-Step Deployment](#step-by-step-deployment)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides complete instructions for deploying Growflow on your custom domain `truenorthgroupltd.com` with the following structure:

- **Customer App**: `https://growflow.truenorthgroupltd.com`
- **Admin Portal**: `https://growflow.truenorthgroupltd.com/admin`

### Requirements

- Domain: `truenorthgroupltd.com` (with DNS access)
- Hosting: VPS or managed hosting platform
- SSL Certificate: Let's Encrypt (free) or commercial
- Database: PostgreSQL 14+
- Node.js: 18+ (for build)

---

## Domain DNS Configuration

### Option A: Subdomain Setup (Recommended)

Point `growflow.truenorthgroupltd.com` to your server:

| Record Type | Host/Name | Value/Points To | TTL |
|-------------|-----------|-----------------|-----|
| A | growflow | YOUR_SERVER_IP | 3600 |
| OR CNAME | growflow | your-server.com | 3600 |

**DNS Records to Add:**

```
# If using a VPS with static IP:
Type: A
Name: growflow
Value: 123.45.67.89  (Your server IP address)
TTL: 3600

# If using a managed hosting platform:
Type: CNAME
Name: growflow
Value: your-app.hosting-provider.com
TTL: 3600
```

### Option B: Root Domain with Path

If you want to use `truenorthgroupltd.com/growflow`:

| Record Type | Host/Name | Value | TTL |
|-------------|-----------|-------|-----|
| A | @ | YOUR_SERVER_IP | 3600 |

Then configure your web server to serve the app at `/growflow` path.

---

## Hosting Options

### Option 1: VPS (Virtual Private Server) - Recommended

**Providers:** DigitalOcean, AWS EC2, Linode, Vultr

**Server Requirements:**
- Ubuntu 22.04 LTS
- 2GB RAM minimum (4GB recommended)
- 20GB SSD storage
- 1 vCPU

**Cost:** ~$10-20/month

**Pros:**
- Full control
- Scalable
- Cost-effective

### Option 2: Managed Hosting (Netlify/Vercel)

**Providers:** Netlify, Vercel, Cloudflare Pages

**Cost:** Free tier available, Pro ~$20/month

**Pros:**
- Easy deployment
- Automatic HTTPS
- CDN included

**Cons:**
- Limited backend capabilities
- May need separate database hosting

### Option 3: Platform-as-a-Service (Heroku/Railway)

**Providers:** Heroku, Railway, Render

**Cost:** ~$7-25/month

**Pros:**
- Simple deployment
- Built-in database
- Auto-scaling

---

## SSL/TLS Certificate Setup

### Option A: Let's Encrypt (Free) - Recommended

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d growflow.truenorthgroupltd.com

# Auto-renewal (automatically configured)
sudo certbot renew --dry-run
```

### Option B: Cloudflare (Free)

1. Sign up at cloudflare.com
2. Add your domain
3. Change nameservers to Cloudflare
4. Enable "Full (Strict)" SSL mode
5. Add DNS record for `growflow` subdomain

### Option C: Commercial Certificate

Purchase from:
- DigiCert
- Sectigo
- Namecheap

---

## Environment Variables

Create a `.env` file on your server:

```env
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://growflow.truenorthgroupltd.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/growflow
DB_HOST=localhost
DB_PORT=5432
DB_NAME=growflow
DB_USER=growflow_user
DB_PASSWORD=your_secure_password

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here

# File Storage (AWS S3 or local)
STORAGE_TYPE=local
UPLOAD_DIR=/var/www/growflow/uploads

# AWS S3 (optional)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_S3_BUCKET=growflow-uploads
# AWS_REGION=us-east-1

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@truenorthgroupltd.com
SMTP_PASS=your_app_password

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@greenflow.com
ADMIN_PASSWORD=change_this_password
```

---

## Database Setup

### PostgreSQL Installation (Ubuntu)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE growflow;
CREATE USER growflow_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE growflow TO growflow_user;
\q
```

### Database Schema

The application uses the following tables:

```sql
-- Users table (Admin/Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'collector')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    community VARCHAR(255) NOT NULL,
    landmark TEXT NOT NULL,
    waste_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_quote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    agreed_amount_usd DECIMAL(10,2) NOT NULL,
    agreed_amount_lrd DECIMAL(10,2),
    start_date DATE NOT NULL,
    set_by UUID REFERENCES users(id),
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    payment_month INTEGER NOT NULL CHECK (payment_month BETWEEN 1 AND 12),
    payment_year INTEGER NOT NULL,
    paid_currency VARCHAR(3) NOT NULL CHECK (paid_currency IN ('USD', 'LRD')),
    paid_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    proof_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    UNIQUE(customer_id, payment_month, payment_year, status)
);

-- Create indexes for performance
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_month ON payments(payment_month, payment_year);
```

---

## File Storage Setup

### Local Storage (Default)

```bash
# Create upload directory
sudo mkdir -p /var/www/growflow/uploads
sudo chown -R www-data:www-data /var/www/growflow/uploads
sudo chmod 755 /var/www/growflow/uploads
```

### AWS S3 (Optional)

1. Create S3 bucket: `growflow-uploads-truenorth`
2. Enable CORS:
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://growflow.truenorthgroupltd.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

---

## Step-by-Step Deployment

### Step 1: Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 2: Clone and Build Application

```bash
# Create app directory
sudo mkdir -p /var/www/growflow
sudo chown $USER:$USER /var/www/growflow
cd /var/www/growflow

# Clone repository (or upload files)
git clone https://github.com/your-repo/growflow.git .
# OR upload the source code via SCP/FTP

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the `dist` folder
```

### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/growflow`:

```nginx
server {
    listen 80;
    server_name growflow.truenorthgroupltd.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name growflow.truenorthgroupltd.com;
    
    # SSL Certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/growflow.truenorthgroupltd.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/growflow.truenorthgroupltd.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Root directory
    root /var/www/growflow/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service Worker - no cache
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Manifest - no cache
    location /manifest.json {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if you add a backend API later)
    # location /api {
    #     proxy_pass http://localhost:3000;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    # }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/growflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Set Up SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d growflow.truenorthgroupltd.com

# Follow the prompts to complete setup
```

### Step 5: Set Proper Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/growflow/dist

# Set permissions
sudo chmod -R 755 /var/www/growflow/dist
```

---

## Verification

### 1. Check DNS Propagation

```bash
# Check if DNS is pointing correctly
nslookup growflow.truenorthgroupltd.com
dig growflow.truenorthgroupltd.com
```

### 2. Test HTTPS

```bash
# Test SSL certificate
curl -I https://growflow.truenorthgroupltd.com

# Check SSL grade (optional)
# Visit: https://www.ssllabs.com/ssltest/
```

### 3. Verify Application

1. Visit `https://growflow.truenorthgroupltd.com`
2. Test customer signup
3. Test admin login at `/admin`
4. Test PWA install prompt

### 4. Check Nginx Logs

```bash
# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Issue: DNS Not Propagating

**Solution:**
- Wait 24-48 hours for DNS propagation
- Check DNS records at `whatsmydns.net`
- Verify nameservers are correct

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check if files exist
ls -la /var/www/growflow/dist/
```

### Issue: SSL Certificate Error

**Solution:**
```bash
# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

### Issue: PWA Not Installing

**Solution:**
- Verify manifest.json is accessible
- Check service worker registration in browser console
- Ensure HTTPS is enabled
- Test in Chrome/Edge (best PWA support)

---

## Maintenance

### Update Application

```bash
cd /var/www/growflow

# Pull latest changes
git pull origin main

# Rebuild
npm install
npm run build

# Restart Nginx (if needed)
sudo systemctl restart nginx
```

### Backup Database

```bash
# Backup PostgreSQL
sudo -u postgres pg_dump growflow > growflow_backup_$(date +%Y%m%d).sql

# Backup uploads
sudo tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/growflow/uploads
```

### Renew SSL Certificate

```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is usually configured, but you can force it:
sudo certbot renew
```

---

## Support

For technical support:
- Email: support@truenorthgroupltd.com
- Documentation: https://docs.growflow.truenorthgroupltd.com

---

**© TrueNorth Group of Companies Ltd. All rights reserved.**
