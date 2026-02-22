# Growflow Deployment Guide
## Complete Setup for truenorthgroupltd.com

© TrueNorth Group of Companies Ltd. All rights reserved.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  https://growflow.truenorthgroupltd.com                 │    │
│  │  - React Frontend (PWA)                                  │    │
│  │  - Static files served by CDN/Nginx                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE / CDN                            │
│  - DDoS Protection                                               │
│  - SSL/TLS Termination                                           │
│  - Static Asset Caching                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VPS / HOSTING SERVER                         │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Nginx         │    │  Node.js API    │                     │
│  │   (Reverse      │◄──►│  (Port 3000)    │                     │
│  │    Proxy)       │    │                 │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│         │                        │                              │
│         │ Static Files           │ SQL Queries                  │
│         ▼                        ▼                              │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  /var/www/html  │    │   PostgreSQL    │                     │
│  │  (Built React)  │    │   (Port 5432)   │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Option 1: Full-Stack Deployment (Recommended)

This deploys both frontend and backend with PostgreSQL database.

### Step 1: Provision a VPS

**Recommended Providers:**
- DigitalOcean: $12/month (2GB RAM, 1 vCPU)
- AWS Lightsail: $10/month
- Linode: $12/month
- Hetzner: €5/month (cheapest)

**Server Requirements:**
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- 25GB SSD
- 1 vCPU

### Step 2: DNS Configuration

Add these records in **Google Domains** (or your DNS provider):

| Record Type | Host/Name | Value/Target | TTL |
|-------------|-----------|--------------|-----|
| **A** | `growflow` | `YOUR_VPS_IP_ADDRESS` | 3600 |
| **A** | `api` | `YOUR_VPS_IP_ADDRESS` | 3600 |

**Example with real values:**
```
Type: A
Name: growflow
Value: 192.168.1.100  (replace with your actual VPS IP)
TTL: 3600

Type: A
Name: api
Value: 192.168.1.100  (same VPS IP)
TTL: 3600
```

### Step 3: Server Setup

SSH into your server and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Step 4: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE growflow;
CREATE USER growflow_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE growflow TO growflow_user;
\q

# Test connection
psql -U growflow_user -d growflow -h localhost
```

### Step 5: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/growflow
sudo chown $USER:$USER /var/www/growflow
cd /var/www/growflow

# Clone or upload your code
git clone https://github.com/yourusername/growflow.git .
# OR use SCP to upload the growflow-fullstack folder

# Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings

# Run migrations
npm run db:migrate

# Seed database (creates admin user)
npm run db:seed

# Start backend with PM2
pm2 start npm --name "growflow-api" -- start
pm2 save
pm2 startup

# Setup Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=https://api.growflow.truenorthgroupltd.com/api

# Build frontend
npm run build

# Copy build to nginx directory
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### Step 6: Nginx Configuration

Create `/etc/nginx/sites-available/growflow`:

```nginx
# API Server
server {
    listen 80;
    server_name api.growflow.truenorthgroupltd.com;
    
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
    }
}

# Frontend Server
server {
    listen 80;
    server_name growflow.truenorthgroupltd.com;
    
    root /var/www/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/growflow /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL/TLS Certificate (HTTPS)

```bash
# Obtain certificates for both domains
sudo certbot --nginx -d growflow.truenorthgroupltd.com -d api.growflow.truenorthgroupltd.com

# Follow the prompts
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run
```

**SSL Provisioning Timeline:**
- DNS propagation: 5 minutes - 24 hours (usually < 1 hour)
- Certificate issuance: 1-5 minutes
- Total time: Usually under 30 minutes

**If SSL is stuck:**
1. Verify DNS points to correct IP: `nslookup growflow.truenorthgroupltd.com`
2. Check port 80 is open: `sudo ufw allow 80`
3. Verify Nginx is running: `sudo systemctl status nginx`
4. Check Certbot logs: `sudo cat /var/log/letsencrypt/letsencrypt.log`

### Step 8: Environment Variables

**Backend `.env`:**
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://growflow.truenorthgroupltd.com

DB_HOST=localhost
DB_PORT=5432
DB_NAME=growflow
DB_USER=growflow_user
DB_PASSWORD=your_secure_database_password

JWT_SECRET=your_jwt_secret_here_generate_with_openssl_rand_base64_32
ADMIN_PASSWORD=changeme123

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Frontend `.env`:**
```env
VITE_API_URL=https://api.growflow.truenorthgroupltd.com/api
```

---

## Option 2: Static Frontend Only (Simpler)

Deploy just the frontend to a static hosting platform.

### Netlify Deployment

1. **Connect GitHub repo to Netlify**
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variable:**
   - `VITE_API_URL` = your backend URL

### DNS for Netlify:

| Record Type | Host/Name | Value | TTL |
|-------------|-----------|-------|-----|
| **CNAME** | `growflow` | `your-site-name.netlify.app` | 3600 |

Netlify provides **automatic HTTPS** - no manual SSL setup needed!

---

## Security Checklist

### Change Default Admin Password

**Immediately after deployment:**

1. Login at `/admin` with:
   - Email: `admin@greenflow.com`
   - Password: `changeme123` (or what you set in ADMIN_PASSWORD)

2. **Change password via API or database:**

```bash
# On server, run:
cd /var/www/growflow/backend
node -e "
const bcrypt = require('bcryptjs');
const newPassword = 'YourNewSecurePassword123!';
bcrypt.hash(newPassword, 10).then(hash => {
  console.log('UPDATE users SET password_hash = \\'' + hash + '\\' WHERE email = \\'admin@greenflow.com\\';');
});
"

# Then run the generated SQL in PostgreSQL
sudo -u postgres psql -d growflow -c "UPDATE users SET password_hash = '\$2a\$10\$...' WHERE email = 'admin@greenflow.com';"
```

### Security Best Practices

1. ✅ **Change default admin password immediately**
2. ✅ **Use strong JWT_SECRET** (32+ random characters)
3. ✅ **Enable firewall**: `sudo ufw allow 22,80,443,3000`
4. ✅ **Keep system updated**: `sudo apt update && sudo apt upgrade -y`
5. ✅ **Use strong database password**
6. ✅ **Enable automatic security updates**:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

---

## Monitoring & Maintenance

### View Logs

```bash
# Application logs
pm2 logs growflow-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Backup Database

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/ubuntu/backups
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U growflow_user growflow > $BACKUP_DIR/growflow_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "growflow_*.sql" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /home/ubuntu/backup.sh" | crontab -
```

### Update Application

```bash
cd /var/www/growflow

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
pm2 restart growflow-api

# Update frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "\l"

# Check user exists
sudo -u postgres psql -c "\du"
```

### Issue: "API returns 502 Bad Gateway"

```bash
# Check backend is running
pm2 status
pm2 logs growflow-api

# Check port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### Issue: "SSL certificate not working"

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

---

## Live API Endpoints

Once deployed, your API will be available at:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://api.growflow.truenorthgroupltd.com/health` | GET | Health check |
| `https://api.growflow.truenorthgroupltd.com/api/auth/customer/signup` | POST | Customer signup |
| `https://api.growflow.truenorthgroupltd.com/api/auth/customer/login` | POST | Customer login |
| `https://api.growflow.truenorthgroupltd.com/api/auth/staff/login` | POST | Staff login |
| `https://api.growflow.truenorthgroupltd.com/api/customers` | GET | List customers |
| `https://api.growflow.truenorthgroupltd.com/api/payments/pending` | GET | Pending payments |
| `https://api.growflow.truenorthgroupltd.com/api/admin/metrics` | GET | Dashboard metrics |

---

## Support

For technical support:
- Email: support@truenorthgroupltd.com

---

**© TrueNorth Group of Companies Ltd. All rights reserved.**
