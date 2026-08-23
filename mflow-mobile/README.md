# MFlow POS Mobile App 📱

The official React Native (Expo) mobile Point of Sale terminal application for **MFlow POS v2.0**. Designed for iOS and Android devices to provide fast retail register checkout, thermal receipt printing, PDF sharing, inventory stock tracking, and daily business performance analytics.

---

## 🌟 Key Features

- 🛍️ **POS Register Terminal**: Touch-optimized catalog for products & non-inventory services with instant checkout (Cash & M-PESA).
- 🖨️ **Wireless & Bluetooth Thermal Printing**: Built-in 80mm monospace thermal receipt rendering supporting ESC/POS, Bluetooth, and AirPrint printers via `expo-print`.
- 💬 **PDF Receipt Sharing**: Generate PDF receipts on the fly and share directly via **WhatsApp**, **Email**, or **SMS** via `expo-sharing`.
- 🏠 **Daily Analytics Dashboard**: Real-time sales metrics, net profit, recorded outflows, and low stock warning alerts.
- 📦 **Inventory & Stock Management**: Real-time stock counts with automated low-stock warnings (`stock <= reorderLevel`).
- 📉 **Business Expenses Log**: On-the-go recording and auditing of business outflows.
- 🏬 **Multi-Branch Selector**: Switch active shop locations seamlessly.
- 🛡️ **Google Play Store & App Store Compliant**: **Zero in-app subscription purchases or payment prompts** to avoid Play Store 30% IAP commissions. Passive read-only subscription status inherited directly from the backend.

---

## 🏗️ Tech Stack

- **Framework**: [Expo](https://expo.dev) (React Native SDK 51+)
- **Language**: TypeScript (`.tsx`)
- **Navigation**: `@react-navigation/native` & `@react-navigation/bottom-tabs`
- **State Management**: `zustand` (with `@react-native-async-storage/async-storage` session persistence)
- **API Client**: `axios` with JWT token auto-injection
- **Thermal Printing & PDFs**: `expo-print` & `expo-sharing`
- **Icons**: `lucide-react-native`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/go) app installed on your physical Android or iOS device.

### 2. Installation
```bash
cd mflow-mobile
npm install
```

### 3. API Configuration
Open `src/api/client.ts` and set your backend API URL:
```typescript
// For local testing on physical devices, set to your computer's local IP address:
export const API_BASE_URL = 'http://192.168.1.X:5000/api/v1'; // or production URL
```

### 4. Running the App via Expo Go
```bash
npm run start
```
Scan the displayed QR code using the **Expo Go** app on your mobile phone!

---

## 📁 Directory Structure

```
mflow-mobile/
├── App.tsx                       # Main Expo app entry & providers
├── app.json                      # Expo configuration & app metadata
├── src/
│   ├── api/
│   │   └── client.ts             # Axios instance with JWT interceptors
│   ├── store/
│   │   └── authStore.ts          # Auth state, branch switcher & subscription check
│   ├── navigation/
│   │   ├── RootNavigator.tsx     # Auth stack vs Main navigation
│   │   └── MainTabNavigator.tsx  # Bottom Tab Bar navigation
│   ├── screens/
│   │   ├── pos/
│   │   │   └── POSScreen.tsx     # Primary Register & Checkout
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx # Daily KPI metrics & stock alerts
│   │   ├── products/
│   │   │   └── ProductsScreen.tsx  # Product catalog & stock audit
│   │   ├── expenses/
│   │   │   └── ExpensesScreen.tsx  # Business outflows & record expense
│   │   ├── sales/
│   │   │   └── SalesHistoryScreen.tsx # Sales history & receipt preview
│   │   └── profile/
│   │       └── ProfileScreen.tsx   # Staff details & branch switcher
│   └── utils/
│       └── mobilePrint.ts        # Thermal HTML generator, print & PDF share
```

---

## 📄 License
Privately developed for MFlow POS Enterprise Ecosystem.
