export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'mflow v2 Smart Retail POS API',
    version: '2.0.0',
    description:
      'Comprehensive RESTful API documentation for mflow v2 POS & Inventory Management System (Express + TypeScript + PostgreSQL + Prisma ORM).',
  },
  servers: [
    {
      url: 'http://localhost:8080/api/v1',
      description: 'Local Development Server (v1 API)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token returned from /auth/login or /auth/register',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register New Business Owner',
        description:
          'Registers a new business owner account, creates the Business, default "Main Branch" shop, and attaches a 14-day Free Trial subscription.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName', 'businessName'],
                properties: {
                  email: { type: 'string', example: 'owner@shop.com' },
                  password: { type: 'string', example: 'Password123!' },
                  fullName: { type: 'string', example: 'John Doe' },
                  businessName: { type: 'string', example: 'Apex Retail Mart' },
                  phoneNumber: { type: 'string', example: '+254712345678' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User and business registered successfully' },
          400: { description: 'Validation error or email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate User & Login',
        description: 'Authenticates credentials and returns JWT Access Token + HttpOnly Refresh Token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'owner@shop.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Authenticated User Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthenticated' },
        },
      },
    },
    '/business': {
      get: {
        tags: ['Business & Shops'],
        summary: 'Get Business Profile & Active Subscription',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Business profile retrieved' } },
      },
    },
    '/business/shops': {
      get: {
        tags: ['Business & Shops'],
        summary: 'List Business Shops/Branches',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Shops retrieved' } },
      },
      post: {
        tags: ['Business & Shops'],
        summary: 'Create New Shop Branch (Guarded by Plan Limit)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Westlands Branch' },
                  location: { type: 'string', example: 'Nairobi Westlands' },
                  phone: { type: 'string', example: '+254700000000' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Shop created' },
          400: { description: 'Plan limit reached' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Product Catalog & Stock'],
        summary: 'Get Catalog Products with Direct Stock',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Products list' } },
      },
      post: {
        tags: ['Product Catalog & Stock'],
        summary: 'Create Product with Initial Stock',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'sellingPrice'],
                properties: {
                  name: { type: 'string', example: 'Wireless Mouse' },
                  sellingPrice: { type: 'number', example: 25.0 },
                  costPrice: { type: 'number', example: 15.0 },
                  quantity: { type: 'number', example: 50 },
                  minStockLevel: { type: 'number', example: 5 },
                  sku: { type: 'string', example: 'MS-W-01' },
                  barcode: { type: 'string', example: '600123456789' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/sales': {
      get: {
        tags: ['POS Sales'],
        summary: 'Get Completed Sales History',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Sales list' } },
      },
      post: {
        tags: ['POS Sales'],
        summary: 'Process POS Checkout Sale (Deducts Stock & Generates Receipt Payload)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items', 'payments'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'number', example: 2 },
                        unitPrice: { type: 'number', example: 25.0 },
                      },
                    },
                  },
                  payments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        paymentMethod: { type: 'string', example: 'CASH' },
                        amount: { type: 'number', example: 50.0 },
                      },
                    },
                  },
                  customerId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Sale processed successfully' } },
      },
    },
    '/quotations': {
      get: {
        tags: ['Quotations & Estimates'],
        summary: 'List Quotations',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Quotations list' } },
      },
    },
    '/expenses': {
      get: {
        tags: ['Expense Management'],
        summary: 'List Operating Expenses',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Expenses list' } },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers & Debt'],
        summary: 'List Customers & Outstanding Debt Balances',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Customer list' } },
      },
    },
    '/purchases/orders': {
      get: {
        tags: ['Purchases & Suppliers'],
        summary: 'List Purchase Orders',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Purchase orders list' } },
      },
    },
    '/reports/dashboard': {
      get: {
        tags: ['Reports & Analytics'],
        summary: 'Get Dashboard Summary Metrics (Revenue, Net Profit, Low Stock)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Dashboard metrics' } },
      },
    },
    '/subscriptions/plans': {
      get: {
        tags: ['Subscriptions & Billing'],
        summary: 'List Public Subscription Plans (Free Trial, Starter, Growth, Enterprise)',
        responses: { 200: { description: 'Subscription plans list' } },
      },
    },
  },
};
