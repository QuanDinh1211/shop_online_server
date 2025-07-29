import express from "express";
import db from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/direct", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { name, phone, address, items, notes, paymentMethod, totalPrice } =
      req.body;
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

    const orderCode = `ORD${Date.now()}${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Tạo đơn hàng
    const [orderResult] = await connection.execute(
      `
      INSERT INTO orders (user_id, name, phone, address, notes, payment_method, order_code, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        name,
        phone,
        address,
        notes || "",
        paymentMethod || "cash",
        orderCode,
        totalPrice || 0,
      ]
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
        orderCode,
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

// GET /orders/get-by-user Lấy tất cả đơn hàng của user hiện tại (kèm sản phẩm từng đơn)
router.get("/get-by-user", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.user.id;
    // Lấy tất cả đơn hàng của user
    const [orders] = await connection.execute(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );

    if (orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    const orderIds = orders.map((order) => order.id);

    // Lấy tất cả sản phẩm của các đơn hàng này, join đủ thông tin Product và Category
    const [items] = await connection.query(
      `SELECT 
          oi.order_id, 
          oi.quantity, 
          p.id as product_id, 
          p.name as product_name, 
          p.price as product_price, 
          p.image as product_image, 
          p.description as product_description, 
          u.name as product_unit, 
          p.inStock as product_in_stock,
          c.id as category_id,
          c.name as category_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN units u ON p.unit_id = u.id
        WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})`,
      orderIds
    );

    // Gom sản phẩm theo từng đơn hàng, đúng dạng CartItem[]
    const itemsByOrder = {};
    items.forEach((item) => {
      const cartItem = {
        product: {
          id: item.product_id,
          name: item.product_name,
          price: Number(item.product_price),
          image: item.product_image,
          description: item.product_description,
          unit: item.product_unit,
          inStock: Boolean(item.product_in_stock),
          category: {
            id: item.category_id,
            name: item.category_name,
          },
        },
        quantity: item.quantity,
      };
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(cartItem);
    });

    // Map lại đúng model Order
    const ordersMapped = orders.map((order) => ({
      id: String(order.id),
      order_code: order.order_code,
      items: itemsByOrder[order.id] || [],
      orderInfo: {
        name: order.name,
        phone: order.phone,
        address: order.address,
        paymentMethod: order.payment_method,
        notes: order.notes,
        totalAmount: Number(order.total_amount),
      },
      totalPrice: Number(order.total_amount),
      status: order.status,
      createdAt: order.created_at
        ? new Date(order.created_at).toISOString()
        : null,
      updatedAt: order.updated_at
        ? new Date(order.updated_at).toISOString()
        : null,
      estimatedDelivery: order.estimated_delivery
        ? new Date(order.estimated_delivery).toISOString()
        : undefined,
    }));

    res.json({ success: true, orders: ordersMapped });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  } finally {
    connection.release();
  }
});

export default router;
