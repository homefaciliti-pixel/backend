# Home Faciliti - User App & Backend Services

A full-stack Home Services booking solution consisting of a **Flutter Mobile Application** and a **Node.js Express REST API Backend**.

---

## 🌐 Live Server Endpoints

- **User Backend API**: [https://backend-1-ux3b.onrender.com](https://backend-1-ux3b.onrender.com)
- **Admin Backend API**: [https://adminbackend-1-h03r.onrender.com](https://adminbackend-1-h03r.onrender.com)

---

## 🚀 Features Overview

### 📱 Flutter Mobile App (`lib/`)
- **Category & Service Discovery**: Browse services (Plumber, AC Repair, Electrician, Cleaning, etc.).
- **Dynamic Banners & Sub-Categories**: Real-time service and category fetching with image resolution.
- **Cart Management**: Add multiple services to cart, update quantities, clear cart.
- **Multi-Service Checkout**: Combined billing total, address selection, time-slot selection.
- **Multiple Payment Modes**: Cash on Delivery (COD), Wallet, Razorpay Online Payment, AMC membership.

### ⚙️ Node.js Express Backend (`backend/`)
- **Dual-Layer Persistence**: MySQL Database with fallback to JSON storage (`database.json`).
- **Cart Engine**: In-memory `memoryCart` synced with `node_cart` DB table.
- **Checkout Engine**: Phone-keyed `draftOrders` state machine with fallback order resolution.
- **Localization Support**: Multi-lingual responses (English & Hindi) for services, banners, and status messages.

---

## 📡 Key API Reference

### 🔐 Authentication
All Cart & Checkout APIs accept user authentication via:
- `Authorization: Bearer <phone_or_token>` (e.g. `Authorization: Bearer 9876543210`)
- Custom Header: `x-user-id: <user_id>`

---

### 🛒 Cart APIs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/cart/add` | Add service item to cart (`{ serviceId, quantity }`) |
| `GET` | `/api/cart` | Get logged-in user's complete cart with service details |
| `PUT` | `/api/cart/update-quantity` | Update item quantity (`{ serviceId, quantity }`) |
| `DELETE` | `/api/cart/remove/:serviceId` | Remove a single service item from cart |
| `DELETE` | `/api/cart/clear` | Clear user's entire cart |

---

### 💳 Checkout & Order APIs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/checkout/:userId` | Get checkout summary (includes all cart items, total quantity, subtotal, and grand total) |
| `POST` | `/api/checkout` | Place order for cart items (`{ paymentMethod }`) |
| `POST` | `/api/orders` | Standard order creation endpoint |

---

## 📁 Repository Directory Structure

```
userapp-main/
├── android/               # Android Native Project Files
├── ios/                   # iOS Native Project Files
├── lib/                   # Flutter Application Source Code
│   ├── main.dart
│   ├── models/
│   ├── providers/
│   ├── screens/
│   └── services/
├── backend/               # Node.js Express Backend
│   ├── server.js          # Monolithic Express API Server
│   ├── database.json      # Fallback Data Store
│   ├── package.json       # Backend Dependencies
│   └── uploads/           # Static Uploaded Media Assets
├── assets/                # App Assets (Images, Icons)
├── pubspec.yaml           # Flutter Dependencies Config
└── README.md              # Project Documentation
```

---

## 🛠️ How to Run Locally

### 1️⃣ Run Backend (Node.js)
```bash
cd backend
npm install
node server.js
```
The server will start on `http://localhost:5000`.

### 2️⃣ Run Mobile App (Flutter)
```bash
# Get Flutter dependencies
flutter pub get

# Run on emulator/connected device
flutter run
```

---

## 🚀 Deployment

The backend is configured for continuous deployment on **Render**. Pushing updates to the `main` git branch triggers an automatic rebuild and deployment.

```bash
git add .
git commit -m "Your update message"
git push origin main
```
