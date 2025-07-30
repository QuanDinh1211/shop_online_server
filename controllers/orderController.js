const db = require("../database/connection");
const ExcelJS = require("exceljs");

// Middleware để xử lý lỗi
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Lấy danh sách đơn hàng với tìm kiếm
const getAllOrders = asyncHandler(async (req, res) => {
  const { keySearch, status } = req.query;

  // Xây dựng câu truy vấn động
  let query = `
    SELECT 
      o.id,
      o.order_code,
      o.user_id,
      o.name,
      o.phone,
      o.notes,
      o.payment_method,
      o.address,
      o.total_amount AS total,
      CASE o.status
        WHEN 'shipped' THEN 'shipping'
        ELSE o.status
      END AS status,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt,
      u.email AS user_email,
      u.name AS user_name,
      oi.id AS item_id,
      oi.quantity,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.image AS product_image,
      p.category_id AS categoryId,
      c.name AS category,
      p.unit_id AS unitId,
      u2.name AS unit,
      p.price AS product_price,
      p.inStock,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN units u2 ON p.unit_id = u2.id
  `;
  const conditions = [];
  const params = [];

  // Thêm điều kiện tìm kiếm
  if (keySearch) {
    conditions.push(`(
    o.order_code LIKE ? OR
    o.name LIKE ? OR
    o.phone LIKE ?
  )`);
    params.push(`%${keySearch}%`, `%${keySearch}%`, `%${keySearch}%`);
  }
  if (status) {
    conditions.push("o.status = ?");
    params.push(status === "shipping" ? "shipped" : status);
  }

  // Thêm WHERE và ORDER BY
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY o.created_at DESC";

  const [rows] = await db.execute(query, params);

  // Nhóm dữ liệu theo order.id
  const ordersMap = new Map();
  rows.forEach((row) => {
    const orderId = row.id;
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: row.id,
        order_code: row.order_code,
        customer: {
          name: row.name,
          phone: row.phone,
          address: row.address,
          email: row.user_email,
          paymentMethod: row.payment_method,
          notes: row.notes,
        },
        items: [],
        total: row.total,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    if (row.item_id) {
      // Chỉ thêm item nếu có (không null)
      ordersMap.get(orderId).items.push({
        product: {
          id: row.product_id,
          name: row.product_name,
          category: row.category,
          categoryId: row.categoryId,
          price: row.product_price,
          unit: row.unit,
          unitId: row.unitId,
          description: row.product_description,
          image: row.product_image,
          inStock: row.inStock,
          created_at: row.product_created_at,
          updated_at: row.product_updated_at,
        },
        quantity: row.quantity,
      });
    }
  });

  const orders = Array.from(ordersMap.values());

  res.json({
    success: true,
    message: "Lấy danh sách đơn hàng thành công",
    data: orders,
  });
});

// Lấy chi tiết đơn hàng theo ID
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Lấy thông tin đơn hàng
  const [orderRows] = await db.execute(
    `
    SELECT 
      o.id,
      o.order_code,
      o.user_id,
      o.name,
      o.phone,
      o.notes,
      o.payment_method,
      o.address,
      o.total_amount AS total,
      CASE o.status
        WHEN 'shipped' THEN 'shipping'
        ELSE o.status
      END AS status,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt,
      u.email AS user_email,
      u.name AS user_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `,
    [id]
  );

  if (orderRows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn hàng",
      data: null,
    });
  }

  // Lấy danh sách sản phẩm trong đơn hàng
  const [itemRows] = await db.execute(
    `
    SELECT 
      oi.id,
      oi.quantity,
      oi.price,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.image AS product_image,
      p.category_id AS categoryId,
      c.name AS category,
      p.unit_id AS unitId,
      u.name AS unit,
      p.price AS product_price,
      p.inStock,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN units u ON p.unit_id = u.id
    WHERE oi.order_id = ?
  `,
    [id]
  );

  const order = {
    id: orderRows[0].id,
    order_code: orderRows[0].order_code,
    customer: {
      name: orderRows[0].name,
      phone: orderRows[0].phone,
      address: orderRows[0].address,
      email: orderRows[0].user_email,
      paymentMethod: orderRows[0].payment_method,
      notes: orderRows[0].notes,
    },
    items: itemRows.map((item) => ({
      product: {
        id: item.product_id,
        name: item.product_name,
        category: item.category,
        categoryId: item.categoryId,
        price: item.product_price,
        unit: item.unit,
        unitId: item.unitId,
        description: item.product_description,
        image: item.product_image,
        inStock: item.inStock,
        created_at: item.product_created_at,
        updated_at: item.product_updated_at,
      },
      quantity: item.quantity,
    })),
    total: orderRows[0].total,
    status: orderRows[0].status,
    createdAt: orderRows[0].createdAt,
    updatedAt: orderRows[0].updatedAt,
  };

  res.json({
    success: true,
    message: "Lấy thông tin đơn hàng thành công",
    data: order,
  });
});

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "confirmed",
    "shipping",
    "delivered",
    "cancelled",
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message:
        "Trạng thái không hợp lệ (pending, confirmed, shipping, delivered, cancelled)",
      data: null,
    });
  }

  // Kiểm tra đơn hàng tồn tại
  const [existingOrder] = await db.execute(
    "SELECT id FROM orders WHERE id = ?",
    [id]
  );
  if (existingOrder.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn hàng",
      data: null,
    });
  }

  await db.execute(
    "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
    [status === "shipping" ? "shipping" : status, id]
  );

  const [updatedOrderRows] = await db.execute(
    `
    SELECT 
      o.id,
      o.order_code,
      o.user_id,
      o.name,
      o.phone,
      o.notes,
      o.payment_method,
      o.address,
      o.total_amount AS total,
      CASE o.status
        WHEN 'shipped' THEN 'shipping'
        ELSE o.status
      END AS status,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt,
      u.email AS user_email,
      u.name AS user_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `,
    [id]
  );

  const order = {
    id: updatedOrderRows[0].id,
    order_code: updatedOrderRows[0].order_code,
    customer: {
      name: updatedOrderRows[0].name,
      phone: updatedOrderRows[0].phone,
      address: updatedOrderRows[0].address,
      email: updatedOrderRows[0].user_email,
      paymentMethod: updatedOrderRows[0].payment_method,
      notes: updatedOrderRows[0].notes,
    },
    total: updatedOrderRows[0].total,
    status: updatedOrderRows[0].status,
    createdAt: updatedOrderRows[0].createdAt,
    updatedAt: updatedOrderRows[0].updatedAt,
  };

  res.json({
    success: true,
    message: "Cập nhật trạng thái đơn hàng thành công",
    data: order,
  });
});

// Xuất danh sách đơn hàng ra Excel
const exportOrdersToExcel = asyncHandler(async (req, res) => {
  const { keySearch, status } = req.query;

  let query = `
    SELECT 
      o.id,
      o.order_code,
      o.user_id,
      o.name,
      o.phone,
      o.notes,
      o.payment_method,
      o.address,
      o.total_amount AS total,
      CASE o.status
        WHEN 'shipped' THEN 'shipping'
        ELSE o.status
      END AS status,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt,
      u.email AS user_email,
      u.name AS user_name,
      oi.id AS item_id,
      oi.quantity,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.image AS product_image,
      p.category_id AS categoryId,
      c.name AS category,
      p.unit_id AS unitId,
      u2.name AS unit,
      p.price AS product_price,
      p.inStock,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN units u2 ON p.unit_id = u2.id
  `;
  const conditions = [];
  const params = [];

  if (keySearch) {
    conditions.push(`(
    o.order_code LIKE ? OR
    o.name LIKE ? OR
    o.phone LIKE ?
  )`);
    params.push(`%${keySearch}%`, `%${keySearch}%`, `%${keySearch}%`);
  }
  if (status) {
    conditions.push("o.status = ?");
    params.push(status === "shipping" ? "shipped" : status);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY o.created_at DESC";

  const [rows] = await db.execute(query, params);

  const ordersMap = new Map();
  rows.forEach((row) => {
    const orderId = row.id;
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: row.id,
        order_code: row.order_code,
        customer: {
          name: row.name,
          phone: row.phone,
          address: row.address,
          email: row.user_email,
          paymentMethod: row.payment_method,
          notes: row.notes,
        },
        items: [],
        total: row.total,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    if (row.item_id) {
      ordersMap.get(orderId).items.push({
        product: {
          id: row.product_id,
          name: row.product_name,
          category: row.category,
          categoryId: row.categoryId,
          price: row.product_price,
          unit: row.unit,
          unitId: row.unitId,
          description: row.product_description,
          image: row.product_image,
          inStock: row.inStock,
          created_at: row.product_created_at,
          updated_at: row.product_updated_at,
        },
        quantity: row.quantity,
      });
    }
  });

  const orders = Array.from(ordersMap.values());

  // Tạo workbook Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Orders");

  // Định dạng cột
  worksheet.columns = [
    { header: "Mã đơn hàng", key: "order_code", width: 15 },
    { header: "Tên khách hàng", key: "customer_name", width: 20 },
    { header: "Số điện thoại", key: "phone", width: 15 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Email", key: "email", width: 20 },
    { header: "Phương thức thanh toán", key: "payment_method", width: 20 },
    { header: "Ghi chú", key: "notes", width: 30 },
    { header: "Sản phẩm", key: "products", width: 40 },
    { header: "Tổng tiền", key: "total", width: 15 },
    { header: "Trạng thái", key: "status", width: 15 },
    { header: "Ngày đặt", key: "createdAt", width: 20 },
  ];

  // Thêm style cho header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDDDDDD" },
  };

  // Thêm dữ liệu
  orders.forEach((order) => {
    const productsText = order.items
      .map(
        (item) =>
          `${item.product.name} (x${
            item.quantity
          }, ${item.product.price.toLocaleString("vi-VN")}đ)`
      )
      .join("; ");
    const paymentMethodText =
      order.customer.paymentMethod === "cash"
        ? "Thanh toán khi nhận hàng"
        : order.customer.paymentMethod === "card"
        ? "Thẻ tín dụng/ghi nợ"
        : order.customer.paymentMethod === "bank"
        ? "Chuyển khoản qua internet banking"
        : order.customer.paymentMethod;
    const statusText =
      order.status === "pending"
        ? "Chờ xác nhận"
        : order.status === "confirmed"
        ? "Đã xác nhận"
        : order.status === "shipping"
        ? "Đang giao"
        : order.status === "delivered"
        ? "Đã giao"
        : order.status === "cancelled"
        ? "Đã hủy"
        : order.status;

    worksheet.addRow({
      order_code: order.order_code,
      customer_name: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
      email: order.customer.email || "",
      payment_method: paymentMethodText,
      notes: order.customer.notes || "",
      products: productsText,
      total: order.total.toLocaleString("vi-VN") + "đ",
      status: statusText,
      createdAt: new Date(order.createdAt).toLocaleString("vi-VN"),
    });
  });

  // Thiết lập header để tải file
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

  // Ghi workbook vào response
  await workbook.xlsx.write(res);
  res.end();
});

// Xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Lỗi server nội bộ",
    data: null,
  });
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  errorHandler,
  exportOrdersToExcel,
};
