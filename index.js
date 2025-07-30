const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const unitsRoutes = require("./routes/units");
const orderRoutes = require("./routes/orders");
const customersRoutes = require("./routes/customers");
const dashboardRouter = require("./routes/dashboard");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/admin", authRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/categories", categoriesRoutes);
app.use("/api/admin/units", unitsRoutes);
app.use("/api/admin/orders", orderRoutes);
app.use("/api/admin/customers", customersRoutes);
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/admin/users", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Seafood Admin API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`🐟 Seafood Admin API is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Admin login: POST http://localhost:${PORT}/admin/login`);
});
