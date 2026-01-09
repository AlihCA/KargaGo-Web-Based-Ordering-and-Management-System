import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';
import dotenv from "dotenv";

dotenv.config();

const app = express();
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.post("/api/me/sync", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Always reliable: fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    const email =
      clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      null;

    if (!email) {
      return res.status(400).json({ error: "User has no email address" });
    }

    // Role from Clerk metadata (falls back to "user")
    const role =
      clerkUser.publicMetadata?.role ||
      clerkUser.privateMetadata?.role ||
      "user";

    await pool.query(
      `
      INSERT INTO users (clerk_user_id, email, role, last_login)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        role = VALUES(role),
        last_login = NOW()
      `,
      [clerkUserId, email, role === "admin" ? "admin" : "user"]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ /api/me/sync error:", err);
    return res.status(500).json({ error: "Failed to sync user" });
  }
});


// 🔗 Connect to local MySQL (using promise-based connection)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const upsertUserFromOrder = async (connection, customer) => {
  const clerkUserId = customer.clerk_user_id || customer.id;
  const firstName = customer.first_name || customer.firstName || null;
  const lastName = customer.last_name || customer.lastName || null;

  const query = `
    INSERT INTO users (clerk_user_id, email, first_name, last_name)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      first_name = VALUES(first_name),
      last_name = VALUES(last_name)
  `;

  await connection.query(query, [clerkUserId, customer.email, firstName, lastName]);
};

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL");
    connection.release();
  } catch (err) {
    console.log("❌ Database connection failed:", err);
  }
})();

// =======================
// MIDDLEWARE
// =======================

// Admin middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  const claims = req.auth?.sessionClaims;

  const role =
    claims?.metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.privateMetadata?.role ||
    null;

  if (role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Admin access required",
    });
  }

  next();
};

// =======================
// PUBLIC ROUTES
// =======================

// GET ALL PRODUCTS (Public - used by menu page)
app.get("/products", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(results);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET SINGLE PRODUCT (Public)
app.get("/products/:id", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST ORDERS
// POST ORDERS (Authenticated)
app.post("/orders", ClerkExpressRequireAuth(), async (req, res) => {
  const { items, paymentMethod, address } = req.body;

  // Only COD for now
  const normalizedPayment = String(paymentMethod || "cod").toLowerCase();
  if (normalizedPayment !== "cod") {
    return res.status(400).json({ error: "Invalid payment method" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  if (!address || typeof address !== "string" || !address.trim()) {
    return res.status(400).json({ error: "Address is required" });
  }

  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ✅ Email: try session claims first, then fallback to Clerk API
  let email = null;
  const claims = req.auth?.sessionClaims || {};
  email =
    claims?.email ||
    claims?.primary_email ||
    claims?.primaryEmail ||
    claims?.user?.email ||
    null;

  if (!email) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primaryEmailId = clerkUser.primaryEmailAddressId;
      email =
        clerkUser.emailAddresses?.find((e) => e.id === primaryEmailId)
          ?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        null;
    } catch (e) {
      console.error("❌ Clerk getUser failed:", e);
    }
  }

  if (!email) {
    return res.status(400).json({ error: "Email not available for this user" });
  }

  // Normalize item shape (accept {id, quantity} OR {product_id, quantity})
  const normalizedItems = items.map((it) => ({
    productId: Number(it?.id ?? it?.product_id),
    quantity: Number(it?.quantity),
  }));

  if (normalizedItems.some((it) => !Number.isFinite(it.productId) || it.productId <= 0)) {
    return res.status(400).json({ error: "Invalid product id in cart" });
  }
  if (normalizedItems.some((it) => !Number.isFinite(it.quantity) || it.quantity <= 0)) {
    return res.status(400).json({ error: "Invalid quantity in cart" });
  }

  // Merge duplicates: if same product appears multiple times, add quantities
  const merged = new Map();
  for (const it of normalizedItems) {
    merged.set(it.productId, (merged.get(it.productId) || 0) + it.quantity);
  }
  const productIds = Array.from(merged.keys());

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Upsert user record
    await connection.query(
      `
        INSERT INTO users (clerk_user_id, email)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE email = VALUES(email)
      `,
      [clerkUserId, email]
    );

    // Lock product rows FOR UPDATE so stock can't be oversold
    const placeholders = productIds.map(() => "?").join(",");
    const [rows] = await connection.query(
      `
        SELECT id, price, stock
        FROM products
        WHERE id IN (${placeholders})
        FOR UPDATE
      `,
      productIds
    );

    const productMap = new Map(rows.map((p) => [Number(p.id), p]));

    // Validate each product exists + has enough stock
    for (const [pid, qty] of merged.entries()) {
      const p = productMap.get(pid);
      if (!p) {
        await connection.rollback();
        return res.status(400).json({ error: `Invalid product: ${pid}` });
      }

      const stock = Number(p.stock);
      if (!Number.isFinite(stock) || stock < qty) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient stock for product ${pid}. Available: ${stock}, requested: ${qty}`,
        });
      }
    }

    // Compute total (server-trusted)
    let subtotal = 0;
    const orderItemValues = [];

    for (const [pid, qty] of merged.entries()) {
      const p = productMap.get(pid);
      const price = Number(p.price);
      subtotal += price * qty;

      orderItemValues.push({
        productId: pid,
        quantity: qty,
        price,
      });
    }

    // If you want to include tax in stored total:
    const TAX_RATE = 0.08;
    const totalAmount = Math.round(subtotal * (1 + TAX_RATE) * 100) / 100;

    // Insert order
    const [orderResult] = await connection.query(
      `
        INSERT INTO orders
        (user_id, user_email, total_amount, status, address, payment_method)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        clerkUserId,
        email,
        totalAmount,
        "pending",
        address.trim(),
        "cod",
      ]
    );

    const orderId = orderResult.insertId;

    // Insert items
    const values = orderItemValues.map((it) => [
      orderId,
      it.productId,
      it.quantity,
      it.price,
    ]);

    await connection.query(
      `
        INSERT INTO order_items
        (order_id, product_id, quantity, price)
        VALUES ?
      `,
      [values]
    );

    // Deduct stock
    for (const it of orderItemValues) {
      await connection.query(
        `
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
        `,
        [it.quantity, it.productId]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: "✅ Order created",
      orderId,
      email,
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate: TAX_RATE,
      totalAmount,
      status: "pending",
      paymentMethod: "cod",
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Order error:", err);
    return res.status(500).json({ error: "Failed to create order" });
  } finally {
    connection.release();
  }
});


app.get("/api/orders/me", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [orders] = await pool.query(
      `
      SELECT
        o.id,
        o.total_amount,
        o.status,
        o.payment_method,
        o.address,
        o.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'name', p.name,
            'image_url', p.image_url
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [clerkUserId]
    );

    res.json({ orders });
  } catch (err) {
    console.error("❌ Fetch user orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// =======================
// ADMIN ROUTES - PRODUCTS CRUD
// =======================

// CREATE PRODUCT (Admin only)
app.post("/api/admin/products", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  const { name, category, price, description, image_url, stock } = req.body;

  if (!name || !category || !price || !description || !image_url) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, category, price, description, image_url, stock, in_stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category, price, description, image_url, stock || 0, (stock || 0) > 0 ? 1 : 0]
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE PRODUCT (Admin only)
app.put("/api/admin/products/:id", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, image_url, stock } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE products 
       SET name = ?, category = ?, price = ?, description = ?, image_url = ?, stock = ?, in_stock = ?
       WHERE id = ?`,
      [name, category, price, description, image_url, stock, (stock || 0) > 0 ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE PRODUCT (Admin only)
app.delete("/api/admin/products/:id", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// =======================
// ADMIN ROUTES - USERS
// =======================

// Get all users (Admin only)
app.get("/api/admin/users", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        user_email as email,
        user_id as clerkUserId,
        created_at as createdAt
      FROM orders
      GROUP BY user_email
      ORDER BY created_at DESC
    `);
    
    // Format the data to include firstName and lastName (you can extract from email if needed)
    const users = rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.email.split('@')[0], // Extract name from email
      lastName: '',
      createdAt: user.createdAt
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user and their orders (Admin only)
app.delete("/api/admin/users/:userId", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    // First delete order items
    await pool.query(`
      DELETE oi FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ?
    `, [userId]);

    // Then delete orders
    const [result] = await pool.query('DELETE FROM orders WHERE user_id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User and their orders deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// =======================
// ADMIN ROUTES - ORDERS
// =======================

// Get all orders (Admin only)
app.get("/api/admin/orders", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.id,
        o.user_email,
        o.total_amount,
        o.status,
        o.payment_method,
        o.address,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const normalized = rows.map((o) => ({
      ...o,
      total_amount: Number(o.total_amount) || 0,
      item_count: Number(o.item_count) || 0,
    }));

    res.json(normalized);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


// Update order status (Admin only)
app.patch("/api/admin/orders/:orderId/status", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  const { orderId } = req.params;
  const rawStatus = req.body?.status;
  const status = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";

  const validStatuses = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
    });
  }

  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?', 
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// =======================
// ADMIN ROUTES - STATISTICS
// =======================

// Get admin statistics (Admin only)
app.get("/api/admin/stats", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  try {
    const [productsResult] = await pool.query("SELECT COUNT(*) as count FROM products");
    const totalProducts = Number(productsResult[0].count) || 0;

    const [ordersResult] = await pool.query("SELECT COUNT(*) as count FROM orders");
    const totalOrders = Number(ordersResult[0].count) || 0;

    const [revenueResult] = await pool.query("SELECT SUM(total_amount) as total FROM orders");
    const totalRevenue = Number(revenueResult[0].total) || 0; // ✅ convert to number

    const [pendingResult] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const pendingOrders = Number(pendingResult[0].count) || 0;

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,   
      pendingOrders,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// =======================
// ERROR HANDLING
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});


// =======================
// START SERVER
// =======================

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
