# MFlow POS v2.0 Enterprise Ecosystem 🚀

An end-to-end, multi-tenant Point of Sale (POS), Inventory Management, Financial Ledger, and Retail Analytics platform engineered for retail stores, service businesses, and multi-branch enterprises.

---

## 🏗️ Architecture & Ecosystem Components

The MFlow POS v2.0 monorepo consists of three core micro-applications:

| Application | Directory | Tech Stack | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend API** | [`/mflow-v2-backend`](./mflow-v2-backend) | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL | Central REST API, Auth, Sales Logic, Multi-tenancy, Reports & Accounting |
| **Web Portal** | [`/mflow-v2-frontend`](./mflow-v2-frontend) | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons | Full-featured Web POS Register, Admin Dashboard, Ledger & Inventory Control |
| **Mobile App** | [`/mflow-mobile`](./mflow-mobile) | React Native, Expo SDK, TypeScript, Zustand, Expo-Print | Mobile Touch Register, Wireless Thermal Printing, PDF Sharing & Daily Metrics |

---

## 🌟 Core System Capabilities

- 🛍️ **Point of Sale (POS Register)**: Touch-optimized barcode register supporting physical products & non-inventory service items with instant Cash & M-PESA checkout.
- 🖨️ **Dual Thermal & A4 Printing**:
  - **Thermal 80mm Printing**: Native monospace receipt rendering for POS receipts, quotations, and invoices.
  - **Standard A4 Printing**: Clean full-page document layouts for Profit & Loss Statements, General Ledger Audits, and Sales Logs.
- 📊 **Accounting & Financial Reports**: General Ledger audit trail, Profit & Loss summary, balance sheets, and real-time revenue analytics.
- 📦 **Inventory & Stock Management**: Multi-shop inventory tracking, automated low-stock reorder alerts, and stock operation logs.
- 💸 **Operating Expenses Outflows**: Categorized business expense tracking and net profit calculation.
- 🏬 **Multi-Shop Branch Management**: Single account managing multiple retail branches with role-based staff access (Super Admin, Shop Admin, Sales Rep).
- 🛡️ **Play Store & App Store Compliance**: Mobile app strictly excludes in-app subscription billing to avoid 30% Play Store fees, passively inheriting active subscription status from the backend.

---

## 🚀 Quick Setup & Local Development

### 1. Backend API Server (`mflow-v2-backend`)
```bash
cd mflow-v2-backend
npm install
npx prisma db push
npm run dev
```
*Backend runs on `http://localhost:5000/api/v1`.*

### 2. Web Frontend Portal (`mflow-v2-frontend`)
```bash
cd mflow-v2-frontend
npm install
npm run dev
```
*Web portal runs on `http://localhost:5173`.*

### 3. Mobile React Native App (`mflow-mobile`)
```bash
cd mflow-mobile
npm install
npm run start
```
*Scan the generated QR code using the **Expo Go** app on your physical mobile device.*

---

## 📄 License
Privately developed for MFlow Enterprise POS Solutions.
