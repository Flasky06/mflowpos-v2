# MFlow POS v2.0 — REST API Reference 📖

Base API Endpoint URL: `https://www.mflowpos.com/api/v1` (or `http://localhost:5000/api/v1` for local development).

All requests and responses use standard JSON payloads. Protected endpoints require a valid JWT Access Token passed in the HTTP Authorization header:

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 🔐 1. Authentication Endpoints (`/auth`)

### `POST /auth/login`
Authenticates a user (staff, shop manager, or business admin).

**Request Body:**
```json
{
  "email": "admin@mflowpos.com",
  "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr_12345",
      "email": "admin@mflowpos.com",
      "fullName": "Main Administrator",
      "role": "SUPER_ADMIN",
      "businessId": "biz_67890",
      "business": {
        "id": "biz_67890",
        "name": "MFlow Retail Enterprise",
        "subscription": {
          "status": "ACTIVE",
          "endDate": "2027-12-31T23:59:59.000Z",
          "plan": { "name": "Enterprise Plan" }
        }
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "shopId": "shop_001"
  }
}
```

---

## 🛍️ 2. Sales & Point of Sale (`/sales`)

### `POST /sales`
Creates a completed retail POS transaction receipt (products, services, or mixed cart).

**Request Body:**
```json
{
  "shopId": "shop_001",
  "paymentMethod": "CASH",
  "customerName": "Walk-in Customer",
  "items": [
    {
      "productId": "prod_101",
      "quantity": 2,
      "unitPrice": 1500
    },
    {
      "serviceId": "serv_202",
      "quantity": 1,
      "unitPrice": 800
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "sale_999",
    "receiptNumber": "REC-2026-0042",
    "totalAmount": 3800,
    "status": "COMPLETED",
    "createdAt": "2026-08-23T12:45:00.000Z"
  }
}
```

### `GET /sales`
Queries sales history logs filtered by date range and active shop.

**Query Parameters:**
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `shopId` (optional)

---

## 📦 3. Products Catalog & Inventory (`/products`)

### `GET /products`
Returns all physical products with current stock counts.

### `POST /products`
Creates a new physical product item.

**Request Body:**
```json
{
  "name": "Wireless POS Barcode Scanner",
  "sku": "POS-SCAN-01",
  "barcode": "600123456789",
  "costPrice": 4500,
  "sellingPrice": 6500,
  "stockQuantity": 25,
  "reorderLevel": 5,
  "trackInventory": true
}
```

---

## ✂️ 4. Services Catalog (`/services`)

### `GET /services`
Returns all non-inventory service offerings (Laundry, Repairs, Tailoring, Consultations).

---

## 💸 5. Expenses & Outflows (`/expenses`)

### `GET /expenses`
Retrieves logged business expense outflows.

### `POST /expenses`
Records a business expense.

**Request Body:**
```json
{
  "title": "Monthly Internet Subscription",
  "amount": 4500,
  "paymentMethod": "MPESA",
  "categoryId": "cat_exp_01",
  "notes": "Safaricom Fibre Business"
}
```

---

## 📊 6. Accounting & Reports (`/reports`)

- `GET /reports/dashboard`: Returns summary sales, net profit, and expense totals.
- `GET /reports/top-products`: Returns top selling items breakdown.
- `GET /reports/general-ledger`: Financial general ledger audit statements.

---

## 🏬 7. Shops & Branches (`/business/shops`)

- `GET /business/shops`: Returns list of accessible retail branches for the authenticated user.
