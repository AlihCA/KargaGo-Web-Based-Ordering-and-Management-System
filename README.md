# 🚛 KargaGo  
**A Wholesale E-Commerce Platform for Philippine Goods with Admin Management System**

KargaGo is a full-stack e-commerce web application designed for selling wholesale Philippine goods. It allows customers to browse products, place orders, and complete purchases online, while administrators can manage products, orders, inventory, and sales reports through a secure admin dashboard.

---

## ✦ Features ✦

### 👤 Customer Side
- Browse wholesale products
- View product details (price, stock, description)
- Add items to cart
- Checkout and place orders
- Multiple payment methods
- Order tracking

### 🛠️ Admin Side
- Secure admin authentication
- Product management (Add, Edit, Delete, Update stock)
- Order management (View and update order status)
- Sales dashboard with statistics
- Sales reports (daily, weekly, monthly)
- Inventory updates reflected instantly on customer menu

---

## Technologies Used

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Router
- Clerk Authentication

### Backend
- Node.js
- Express.js
- MySQL
- Clerk (JWT verification)

---

## 🔐 Authentication

KargaGo uses **Clerk** for authentication:
- Customers and admins log in securely
- Admin access is restricted using role-based authorization
- Admin role is stored in Clerk `publicMetadata`

---

## Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AlihCA/KargaGo-Web-Based-Ordering-and-Management-System.git
cd kargago
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

### Create a .env file:
```bash
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kargago
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Start the backend server:
```bash
npm run dev
```

### Backend runs on:
http://localhost:5000

---

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
```

### Create a .env.local file:
```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000
```

### Start the front-end
```bash
npm run dev
```

### Front-end runs on:
http://localhost:5173

---

## 📘 User Manual
### 👥 Customer
 1. Register or log in
 2. Browse products on the menu page
 3. Add items to cart
 4. Proceed to checkout
 5. Place order and track status

---

### 🛠️ Admin
 1. Log in using an admin account
 2. Automatically redirected to Admin Dashboard
 3. Manage products:
    - Add new products
    - Edit product details
    - Update stock
    - Delete products
  4. Manage orders:
     - View all customer orders
     - Update order status (pending, processing, shipped, delivered)
  5. View sales statistics and reports
  6. All updates reflect instantly on the customer menu page

---

## 🔁 Data Synchronization
- The admin dashboard and customer menu use the same API
- Product updates immediately affect:
  - Stock availability
  - Product visibilityOrder placement

--- 

## 🛡️ Security Notes
- Admin routes are protected on both frontend and backend
- JWT tokens are verified using Clerk middleware
- Frontend role checks are for UI only; backend enforces real security


