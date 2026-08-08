# mFlow POS & Business ERP v2 Frontend

High-performance, modern React 19 + Vite + TypeScript web application frontend for **mFlow POS & Business ERP System**, connected to the `mflow-v2-backend` API.

---

## Technical Architecture

* **Core Framework**: React 19 + Vite + TypeScript.
* **Styling**: TailwindCSS v4 with custom glassmorphism panels, dark mode theme, and sleek scrollbars.
* **Routing**: React Router v7 with protected routes and role-based access control.
* **State Management**: Zustand (Auth, Toast Notifications).
* **HTTP Client**: Axios with automatic JWT token refresh, Paywall 402 interceptor, and active account suspension guards.
* **Icons**: Lucide React.
* **Error Resilience**: React Error Boundary + Toast notification stack.

---

## Features & Modules

1. **Dashboard & Scope Filter (`/dashboard`)**: Summary cards for revenue, cash collected, operating expenses, net profit, low stock count, and catalog counts with `PRODUCTS_ONLY`, `SERVICES_ONLY`, and `BOTH` scope toggles.
2. **POS Cashier Checkout (`/pos`)**: Fast POS terminal with barcode scanner input, product grid, service selection, cart, split payments, credit customer ledger updates, and ESC/POS thermal receipt printing payload rendering.
3. **Sales & Service Orders (`/sales`)**: Transaction receipt search, voiding / cancellation (restocking inventory and logging stock history), and service job status progression (`RECEIVED` -> `IN_PROGRESS` -> `READY_FOR_PICKUP` -> `COMPLETED`).
4. **Master Product Catalog (`/products`)**: Master business product definitions, barcode/SKU scanner entry, category filtering, and per-shop `ProductStock` inventory adjustments.
5. **Services Catalog (`/services`)**: Non-inventory services (Laundry, Tailoring, Repairs, Consultations) catalog management.
6. **Stock Transfers & Returns (`/transfers` & `/returns`)**: Inter-shop stock inventory movements between branches and customer/supplier return write-offs.
7. **Customers & Debt Ledger (`/customers`)**: Directory, search, debt balances, and debt repayment processing.
8. **Suppliers & Purchase Orders (`/suppliers`)**: Vendor directory, purchase orders, and goods receiving restocks to branch inventory.
9. **Operating Expenses (`/expenses`)**: Categorized expense entries and financial summaries.
10. **Quotations (`/quotations`)**: Pro-forma estimates and 1-click conversion to active POS sales.
11. **Branch Settings (`/settings/branches`)**: Multi-branch management with `shopType` mode toggle (`PRODUCTS_ONLY`, `SERVICES_ONLY`, `BOTH`).
12. **Staff Management (`/settings/staff`)**: Staff accounts directory and dynamic permission overrides (`CAN_CANCEL_SALE`, `CAN_ADJUST_STOCK`, etc.).
13. **SuperAdmin Panel (`/superadmin`)**: Platform stats, tenant directory, cash subscription payment activations, trial extensions, tenant suspensions, user account suspensions, plan configuration, and platform revenue reports.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The frontend will run locally at `http://localhost:5173`. Ensure `mflow-v2-backend` is running at `http://localhost:8080`.
