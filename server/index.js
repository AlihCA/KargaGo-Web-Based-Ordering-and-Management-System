import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
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
    claims?.privateMetadata?.role ||
    claims?.publicMetadata?.role;

  console.log("🔍 Clerk session claims:", claims);
  console.log("🔐 role resolved:", role);

  if (role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Admin access required",
      debug: { roleFound: role ?? null }
    });
  }

  return next();

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
app.post("/orders", async (req, res) => {
  const { customer, items, totalPrice, paymentMethod, address } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    await upsertUserFromOrder(connection, customer);

    const orderQuery = `
      INSERT INTO orders 
      (user_id, user_email, total_amount, status, address, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(
      orderQuery,
      [
        customer.clerk_user_id || customer.id,
        customer.email,
        totalPrice,
        "pending",
        address || customer.address,
        paymentMethod,
      ]
    );

    const orderId = result.insertId;

    const itemQuery = `
      INSERT INTO order_items 
      (order_id, product_id, quantity, price)
      VALUES ?
    `;

    const values = items.map((item) => [
      orderId,
      item.id,
      item.quantity,
      item.price,
    ]);

    await connection.query(itemQuery, [values]);
    
    await connection.commit();

    res.status(201).json({
      message: "✅ Order created",
      orderId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Order error:", err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
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
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (Admin only)
app.patch("/api/admin/orders/:orderId/status", ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
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
    // Total products
    const [productsResult] = await pool.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = productsResult[0].count;

    // Total orders
    const [ordersResult] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalOrders = ordersResult[0].count;

    // Total revenue
    const [revenueResult] = await pool.query('SELECT SUM(total_amount) as total FROM orders');
    const totalRevenue = revenueResult[0].total || 0;

    // Pending orders
    const [pendingResult] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );
    const pendingOrders = pendingResult[0].count;

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
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

// =======================
// START SERVER
// =======================
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
