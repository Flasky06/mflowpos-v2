# mflow v2 POS & Inventory Management Backend API

A modern, scalable Node.js + Express + TypeScript RESTful API built for multi-tenant retail operations, point of sale (POS) checkout, stock management, quotations, customer debt ledgers, purchase orders, expenses, and analytics.

---

## Tech Stack & Architecture

- **Runtime & Language**: Node.js, Express.js, TypeScript (ES2022)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JWT Access Token (15 min) + HttpOnly Refresh Token (7 days), bcryptjs password hashing
- **Authorization**: 4-tier Role-Based Access Control (SUPER_ADMIN, ADMIN, SHOP_ADMIN, SALES_REP) + Dynamic Granular Permission Guards (`checkPermission`)
- **Paywall Interceptor**: Automated subscription expiration guard (HTTP 402 Payment Required)
- **Documentation**: OpenAPI 3.0 via Swagger UI (`swagger-ui-express`)
- **Validation**: Zod schema validation middleware
- **Email Service**: Resend API integration for email verification and password recovery

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your connection parameters:
```bash
PORT=8080
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/mflow_v2_db?schema=public"
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
RESEND_API_KEY=your_resend_api_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Generate Prisma Client and push database schema:
```bash
npx prisma generate
npx prisma db push
```

Run seed script to populate default subscription plans (FREE_TRIAL, STARTER, GROWTH, ENTERPRISE) and default SuperAdmin account:
```bash
npm run prisma:seed
```

### 5. Start Development Server
```bash
npm run dev
```

The API will be available at:
- Base API: `http://localhost:8080/api/v1`
- Interactive Swagger UI: `http://localhost:8080/api-docs`
- Health Check: `http://localhost:8080/health`

---

## API Modules Overview

| Module | Base Path | Key Features |
| :--- | :--- | :--- |
| **Authentication** | `/api/v1/auth` | Register, Login, Refresh Token, Email Verification, Reset Password, User Profile |
| **User & Permissions** | `/api/v1/users` | Staff User Management, Dynamic Custom Permissions Grants/Revocations |
| **Business & Shops** | `/api/v1/business` | Profile & Currency Settings, Branch Management, Plan Limit Guards |
| **Product Catalog** | `/api/v1/products` | Direct Product Stock, SKUs, Barcodes, Stock Adjustments, Soft Deletes |
| **POS Sales** | `/api/v1/sales` | POS Checkout, Split Payments, Customer Credit Ledger, Thermal Receipts |
| **Quotations** | `/api/v1/quotations` | Estimates, 1-Click Conversion to Active Sale with Stock Deduction |
| **Expenses** | `/api/v1/expenses` | Operating Expense Categories, Expense Tracking, Expense Totals |
| **Customers & Debt** | `/api/v1/customers` | Customer Directory, Debt Tracking, Debt Repayment Processing |
| **Purchases & Suppliers**| `/api/v1/purchases` | Supplier Directory, Purchase Orders, Automatic Goods Restock |
| **Reports & Analytics** | `/api/v1/reports` | Executive Dashboard, Net Profit, Top Products, Inventory Valuation |
| **Subscriptions** | `/api/v1/subscriptions` | Public Plans List, Current Status, Plan Upgrades |
| **SuperAdmin** | `/api/v1/superadmin` | Tenant Directory, Manual Trial Extensions |
