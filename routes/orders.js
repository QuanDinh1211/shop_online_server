import express from "express";
import db from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /orders - Tạo đơn hàng mới
router.post("/", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin bắt buộc",
        message: "name, phone, và address là bắt buộc",
      });
    }

    // Validate phone number (basic)
    if (!/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ""))) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại không hợp lệ",
        message: "Số điện thoại phải có 10-11 chữ số",
      });
    }

    // Bắt đầu transaction
    await connection.beginTransaction();

    // Lấy giỏ hàng của user
    const [cartItems] = await connection.execute(
      `
      SELECT 
        c.product_id,
        c.quantity,
        p.name,
        p.price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "Giỏ hàng trống",
        message: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng",
      });
    }

    // Tạo đơn hàng
    const [orderResult] = await connection.execute(
      `
      INSERT INTO orders (user_id, name, phone, address)
      VALUES (?, ?, ?, ?)
    `,
      [userId, name, phone, address]
    );

    const orderId = orderResult.insertId;

    // Thêm các item vào order_items
    for (const item of cartItems) {
      await connection.execute(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Xóa giỏ hàng của user
    await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [
      userId,
    ]);

    // Commit transaction
    await connection.commit();

    // Tính tổng tiền
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      data: {
        orderId,
        name,
        phone,
        address,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        items: cartItems.map((item) => ({
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(500).json({
      success: false,
      error: "Không thể tạo đơn hàng",
      message: error.message,
    });
  } finally {
    connection.release();
  }
});

router.post("/direct", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { name, phone, address, items, notes, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate input
    if (
      !name ||
      !phone ||
      !address ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin bắt buộc",
        message: "name, phone, address, items là bắt buộc",
      });
    }

    if (!/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ""))) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại không hợp lệ",
        message: "Số điện thoại phải có 10-11 chữ số",
      });
    }

    // Bắt đầu transaction
    await connection.beginTransaction();

    // Lấy thông tin sản phẩm từ DB
    const productIds = items.map((i) => i.productId);
    const [products] = await connection.query(
      `SELECT id, name, price FROM products WHERE id IN (${productIds
        .map(() => "?")
        .join(",")})`,
      productIds
    );

    // Kiểm tra sản phẩm hợp lệ
    const productMap = {};
    products.forEach((p) => {
      productMap[p.id] = p;
    });
    for (const item of items) {
      if (!productMap[item.productId]) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: "Sản phẩm không tồn tại",
          message: `Sản phẩm với id ${item.productId} không tồn tại`,
        });
      }
    }

    // Tạo đơn hàng
    const [orderResult] = await connection.execute(
      `
      INSERT INTO orders (user_id, name, phone, address, notes, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [userId, name, phone, address, notes || "", paymentMethod || "cash"]
    );

    const orderId = orderResult.insertId;

    // Thêm các item vào order_items
    for (const item of items) {
      const product = productMap[item.productId];
      await connection.execute(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `,
        [orderId, item.productId, item.quantity, product.price]
      );
    }

    // Commit transaction
    await connection.commit();

    // Tính tổng tiền
    const totalAmount = items.reduce((sum, item) => {
      const product = productMap[item.productId];
      return sum + product.price * item.quantity;
    }, 0);

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
      data: {
        orderId,
        name,
        phone,
        address,
        notes,
        paymentMethod,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        items: items.map((item) => ({
          productId: item.productId,
          name: productMap[item.productId].name,
          quantity: item.quantity,
          price: productMap[item.productId].price,
          subtotal: productMap[item.productId].price * item.quantity,
        })),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(500).json({
      success: false,
      error: "Không thể tạo đơn hàng",
      message: error.message,
    });
  } finally {
    connection.release();
  }
});

export default router;
