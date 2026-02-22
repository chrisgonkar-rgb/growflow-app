# Growflow - GreenFlow Customer Management System

© TrueNorth Group of Companies Ltd. All rights reserved.

---

## Overview

Growflow is a full-stack Progressive Web Application (PWA) for managing customer subscriptions and payments for GreenFlow City Services sanitation company in Liberia.

### Features

- **Customer Portal**: Signup, login, view subscription, make monthly payments
- **Admin Dashboard**: Manage customers, verify payments, generate reports
- **Monthly Payment Tracking**: Pay for specific months with verification workflow
- **PWA Support**: Install as mobile app, offline capability
- **Multi-currency**: USD (primary) and LRD (optional)
- **Bulk Import**: CSV/Excel customer import
- **Role-based Access**: Admin and Staff roles

---

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React Frontend │─────▶│  Node.js API    │─────▶│   PostgreSQL    │
│   (PWA)          │◀─────│  (Express)      │◀─────│   Database      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Nginx (Proxy)  │
│  + SSL (HTTPS)  │
└─────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE growflow;"
sudo -u postgres psql -c "CREATE USER growflow_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE growflow TO growflow_user;"

# Run schema
sudo -u postgres psql -d growflow -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/health

---

## Default Credentials

**Admin Login:**
- URL: `/admin`
- Email: `admin@greenflow.com`
- Password: `changeme123` (change immediately!)

---

## Project Structure

```
growflow-fullstack/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── types/        # TypeScript types
│   ├── public/           # Static assets
│   └── package.json
│
├── backend/               # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── db/          # Database config
│   │   ├── middleware/  # Auth & error handling
│   │   ├── routes/      # API routes
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utilities
│   └── package.json
│
├── database/              # SQL files
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Seed data
│
├── DEPLOYMENT_GUIDE.md   # Complete deployment guide
└── README.md            # This file
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/customer/signup` | POST | Customer registration |
| `/api/auth/customer/login` | POST | Customer login |
| `/api/auth/staff/login` | POST | Staff login |
| `/api/auth/me` | GET | Get current user |

### Customers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customers` | GET | List all customers |
| `/api/customers/me` | GET | Get own profile |
| `/api/customers/me/subscription` | GET | Get subscription |
| `/api/customers/me/payments` | GET | Get payment history |
| `/api/customers/:id/subscription` | POST | Set subscription |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments` | POST | Create payment |
| `/api/payments/pending` | GET | List pending payments |
| `/api/payments/:id/verify` | PUT | Verify/reject payment |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/metrics` | GET | Dashboard metrics |
| `/api/admin/reports/revenue` | GET | Revenue report |
| `/api/admin/import` | POST | Bulk import customers |
| `/api/admin/export/customers` | GET | Export customers |
| `/api/admin/export/payments` | GET | Export payments |

---

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=growflow
DB_USER=growflow_user
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD=changeme123

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions including:

- VPS setup
- DNS configuration
- SSL/TLS certificate
- Nginx configuration
- Database setup
- Security hardening

---

## Security

### Change Default Admin Password

**Immediately after deployment:**

```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
const password = 'YourNewSecurePassword!';
bcrypt.hash(password, 10).then(h => console.log(h));
"

# Then update in database:
psql -d growflow -c "UPDATE users SET password_hash = 'HASH_HERE' WHERE email = 'admin@greenflow.com';"
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable firewall (ufw)
- [ ] Use HTTPS only
- [ ] Keep dependencies updated
- [ ] Enable automatic security updates

---

## License

© TrueNorth Group of Companies Ltd. All rights reserved.

This software is proprietary and confidential.

---

## Support

For technical support:
- Email: support@truenorthgroupltd.com
