const db = require("../database/connection");

// Middleware để xử lý lỗi
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Lấy dữ liệu dashboard
const getDashboardData = asyncHandler(async (req, res) => {
  // Lấy thống kê
  const [statsRows] = await db.execute(`
    SELECT 
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS totalRevenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pendingOrders,
      (SELECT COUNT(*) FROM products) AS totalProducts,
      (SELECT COUNT(*) FROM users) AS totalCustomers
  `);

  const stats = {
    totalOrders: statsRows[0].totalOrders,
    totalRevenue: statsRows[0].totalRevenue,
    pendingOrders: statsRows[0].pendingOrders,
    totalProducts: statsRows[0].totalProducts,
    totalCustomers: statsRows[0].totalCustomers,
  };

  // Lấy 5 đơn hàng gần đây
  const [orderRows] = await db.execute(`
    SELECT 
      o.id,
      o.order_code,
      o.user_id,
      o.name,
      o.phone,
      o.address,
      o.notes,
      o.payment_method,
      o.total_amount AS total,
      CASE o.status
        WHEN 'shipped' THEN 'shipping'
        ELSE o.status
      END AS status,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt,
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
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN units u2 ON p.unit_id = u2.id
    ORDER BY o.created_at DESC
    LIMIT 5
  `);

  const ordersMap = new Map();
  orderRows.forEach((row) => {
    const orderId = row.id;
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: row.id,
        order_code: row.order_code,
        customer: {
          name: row.name,
          phone: row.phone || "",
          address: row.address || "",
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
  const recentOrders = Array.from(ordersMap.values());

  // Lấy 5 khách hàng gần đây
  const [customerRows] = await db.execute(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      MAX(o.phone) AS phone,
      COUNT(o.id) AS totalOrders,
      COALESCE(SUM(o.total_amount), 0) AS totalSpent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT 5
  `);

  const recentCustomers = customerRows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone || "",
    email: row.email,
    totalOrders: row.totalOrders,
    totalSpent: row.totalSpent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  res.json({
    success: true,
    message: "Lấy dữ liệu dashboard thành công",
    data: {
      stats,
      recentOrders,
      recentCustomers,
    },
  });
});

// Lấy thống kê hôm nay
const getTodayStats = asyncHandler(async (req, res) => {
  // Định nghĩa ngày hôm nay (tính từ 00:00:00 đến 23:59:59)
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayEnd = new Date().setHours(23, 59, 59, 999);
  const todayStartFormatted = new Date(todayStart)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const todayEndFormatted = new Date(todayEnd)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // Lấy thống kê hôm nay
  const [statsRows] = await db.execute(
    `
    SELECT 
      (SELECT COUNT(*) FROM orders WHERE created_at >= ? AND created_at <= ?) AS todayOrders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= ? AND created_at <= ?) AS todayRevenue,
      (SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at <= ?) AS todayCustomers,
      (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'confirmed') AND created_at < ?) AS overdueOrders
  `,
    [
      todayStartFormatted,
      todayEndFormatted,
      todayStartFormatted,
      todayEndFormatted,
      todayStartFormatted,
      todayEndFormatted,
      new Date(todayStart - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
    ]
  );

  const stats = {
    todayOrders: statsRows[0].todayOrders,
    todayRevenue: statsRows[0].todayRevenue,
    todayCustomers: statsRows[0].todayCustomers,
    overdueOrders: statsRows[0].overdueOrders,
  };

  res.json({
    success: true,
    message: "Lấy thống kê hôm nay thành công",
    data: stats,
  });
});

module.exports = {
  getDashboardData,
  getTodayStats,
};
