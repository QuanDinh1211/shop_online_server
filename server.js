import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import categoryRoutes from "./routes/categories.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection khi khởi động server
const initializeServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.log("⚠️  Vui lòng kiểm tra kết nối MySQL và chạy: npm run setup");
    process.exit(1);
  }
};

// API Routes
app.use("/client/api/auth", authRoutes);
app.use("/client/api/products", productRoutes);
app.use("/client/api/cart", cartRoutes);
app.use("/client/api/orders", orderRoutes);
app.use("/client/api/categories", categoryRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Seafood API Server với JWT Authentication và MySQL",
    version: "1.0.0",
    database: "MySQL",
    authentication: "JWT",
    endpoints: {
      auth: {
        "POST /auth/register": "Đăng ký tài khoản mới",
        "POST /auth/login": "Đăng nhập",
      },
      categories: {
        "GET /categories": "Lấy danh sách danh mục",
      },
      products: {
        "GET /products": "Lấy danh sách sản phẩm (hỗ trợ ?categoryId=<id>)",
        "GET /products/:id": "Lấy chi tiết sản phẩm",
      },
      cart: {
        "POST /cart": "Thêm sản phẩm vào giỏ hàng (yêu cầu token)",
        "GET /cart": "Xem giỏ hàng hiện tại (yêu cầu token)",
        "PUT /cart/:itemId": "Cập nhật số lượng (yêu cầu token)",
        "DELETE /cart/:itemId": "Xóa sản phẩm khỏi giỏ (yêu cầu token)",
      },
      orders: {
        "POST /orders": "Tạo đơn hàng mới (yêu cầu token)",
      },
    },
    setup: 'Chạy "npm run setup" để thiết lập database',
    note: "Các API cart và orders yêu cầu JWT token trong header: Authorization: Bearer <token>",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Lỗi server nội bộ",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Có lỗi xảy ra",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint không tồn tại",
    message: `Không tìm thấy ${req.method} ${req.originalUrl}`,
  });
});

// Khởi động server
initializeServer().then(() => {
  app.listen(PORT, () => {
    console.log(
      `🦐 Seafood API Server với JWT Auth đang chạy tại http://localhost:${PORT}`
    );
    console.log(`📊 Database: MySQL`);
    console.log(`🔐 Authentication: JWT`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
