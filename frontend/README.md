# Growflow - GreenFlow Customer Management App

© TrueNorth Group of Companies Ltd. All rights reserved.

---

## Overview

Growflow is a Progressive Web Application (PWA) for managing customer subscriptions and payments for GreenFlow City Services sanitation company in Liberia.

### Features

- **Customer Portal**: Signup, login, view subscription, make monthly payments
- **Admin Dashboard**: Manage customers, verify payments, generate reports
- **Monthly Payment Tracking**: Pay for specific months with verification workflow
- **PWA Support**: Install as mobile app, offline capability
- **Multi-currency**: USD (primary) and LRD (optional)
- **Bulk Import**: CSV/Excel customer import
- **Role-based Access**: Admin and Staff roles

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + localStorage (demo) / PostgreSQL (production)
- **PWA**: Service Worker + Web Manifest
- **Authentication**: JWT-based (production) / localStorage (demo)

---

## Project Structure

```
growflow/
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── icon-*.svg             # App icons
├── src/
│   ├── components/            # Reusable UI components
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication state
│   ├── db/                   # Database layer
│   │   └── index.ts          # CRUD operations
│   ├── hooks/                # Custom React hooks
│   │   └── usePWA.ts         # PWA install hook
│   ├── pages/                # Page components
│   │   ├── LandingPage.tsx
│   │   ├── CustomerSignupPage.tsx
│   │   ├── CustomerLoginPage.tsx
│   │   ├── CustomerDashboardPage.tsx
│   │   ├── PaymentConfirmationPage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   ├── PendingQuotesPage.tsx
│   │   ├── PaymentVerificationPage.tsx
│   │   ├── CustomerDirectoryPage.tsx
│   │   ├── ImportPage.tsx
│   │   └── ReportsPage.tsx
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── App.tsx               # Main app component
│   ├── index.css             # Global styles
│   └── main.tsx              # Entry point
├── index.html                # HTML template
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
└── README.md                 # This file
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/growflow.git
cd growflow

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Demo Credentials

**Staff Login:**
- Email: `admin@greenflow.com`
- Password: `admin123`

---

## Environment Variables

Create `.env` file for production:

```env
NODE_ENV=production
VITE_API_URL=https://api.growflow.truenorthgroupltd.com
VITE_APP_URL=https://growflow.truenorthgroupltd.com
```

---

## Database Schema

### Tables

1. **users** - Admin/Staff accounts
2. **customers** - Customer accounts with auth
3. **subscriptions** - Monthly pricing agreements
4. **payments** - Monthly payment records

See `DEPLOYMENT_GUIDE.md` for full SQL schema.

---

## Authentication Flow

### Customer Signup
1. Fill signup form (name, phone, email, password, location, service details)
2. Account created with status: `pending_quote`
3. Admin sets monthly price
4. Customer receives notification
5. Customer logs in to view and pay

### Customer Login
1. Enter email + password
2. JWT token issued (production) / Session stored (demo)
3. Redirect to dashboard

### Password Reset
1. Request reset with email
2. OTP sent to email
3. Enter OTP + new password
4. Password updated

### Staff Login
1. Enter email + password
2. Role verified (admin/staff)
3. Redirect to admin dashboard

---

## Payment Workflow

1. **Customer submits payment:**
   - Selects month/year
   - Chooses payment method (Cash/Mobile Money)
   - Enters amount (must match agreed price)
   - Uploads proof (optional)
   - Status: `pending`

2. **Admin verifies payment:**
   - Reviews payment queue
   - Approves or rejects
   - If rejected, provides reason
   - Status: `approved` or `rejected`

3. **Customer sees update:**
   - Dashboard shows payment status
   - If rejected, can resubmit

---

## PWA Features

- **Install Prompt**: "Add to Home Screen" on mobile
- **Offline Support**: Cached shell for basic functionality
- **Push Notifications**: Ready for future implementation
- **App Icon**: Custom branded icon

### Testing PWA

1. Open in Chrome/Edge
2. Open DevTools > Lighthouse
3. Run PWA audit
4. Check "Install" button in address bar

---

## Customization

### Brand Colors

Edit `src/index.css`:

```css
:root {
  --primary: 142 76% 36%;  /* Green */
  --accent: 220 50% 25%;   /* Navy */
}
```

### Cities List

Edit `src/types/index.ts`:

```typescript
export const LIBERIA_CITIES = [
  'Paynesville',
  'Monrovia',
  // Add your cities
];
```

### Waste Types

Edit `src/types/index.ts`:

```typescript
export const WASTE_TYPES = [
  { value: 'household', label: 'Household' },
  // Add your types
];
```

---

## Deployment

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions including:

- Domain DNS configuration
- VPS setup
- SSL certificate
- Nginx configuration
- Database setup
- File storage

### Quick Deploy (Netlify)

```bash
# Build
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=dist
```

---

## API Endpoints (Future Backend)

When adding a backend API:

```
POST   /api/auth/customer/signup
POST   /api/auth/customer/login
POST   /api/auth/customer/reset-password
POST   /api/auth/staff/login

GET    /api/customers/me
PUT    /api/customers/me
GET    /api/customers/:id/payments

POST   /api/payments
GET    /api/payments/pending
PUT    /api/payments/:id/verify

GET    /api/admin/customers
POST   /api/admin/customers/import
GET    /api/admin/reports
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License

© TrueNorth Group of Companies Ltd. All rights reserved.

This software is proprietary and confidential.

---

## Support

For support:
- Email: support@truenorthgroupltd.com
- Phone: +231-XXX-XXXX

---

## Changelog

### v1.0.0 (2024)
- Initial release
- Customer signup with authentication
- Monthly payment tracking
- Admin dashboard
- PWA support
- CSV import/export
