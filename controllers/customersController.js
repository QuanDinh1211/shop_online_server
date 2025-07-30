const db = require("../database/connection");
const ExcelJS = require("exceljs");

// Middleware để xử lý lỗi
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Lấy danh sách khách hàng với tìm kiếm
const getAllCustomers = asyncHandler(async (req, res) => {
  const { keySearch, status } = req.query;

  let query = `
    SELECT 
      u.id,
      u.name,
      u.phone,
      u.email,
      u.address,
      u.status,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      COUNT(o.id) AS totalOrders,
      COALESCE(SUM(o.total_amount), 0) AS totalSpent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
  `;
  const conditions = [];
  const params = [];

  if (keySearch) {
    conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
    params.push(`%${keySearch}%`, `%${keySearch}%`, `%${keySearch}%`);
  }
  if (status) {
    conditions.push("u.status = ?");
    params.push(status);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " GROUP BY u.id ORDER BY u.created_at DESC";

  const [rows] = await db.execute(query, params);

  const customers = rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    status: row.status,
    totalOrders: row.totalOrders,
    totalSpent: row.totalSpent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  res.json({
    success: true,
    message: "Lấy danh sách khách hàng thành công",
    data: customers,
  });
});

// Lấy chi tiết khách hàng theo ID
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [customerRows] = await db.execute(
    `
    SELECT 
      u.id,
      u.name,
      u.phone,
      u.email,
      u.address,
      u.status,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      COUNT(o.id) AS totalOrders,
      COALESCE(SUM(o.total_amount), 0) AS totalSpent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `,
    [id]
  );

  if (customerRows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy khách hàng",
      data: null,
    });
  }

  const [orderRows] = await db.execute(
    `
    SELECT 
      o.id,
      o.order_code,
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
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `,
    [id]
  );

  const ordersMap = new Map();
  orderRows.forEach((row) => {
    const orderId = row.id;
    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: row.id,
        order_code: row.order_code,
        customer: {
          name: customerRows[0].name,
          phone: customerRows[0].phone,
          address: customerRows[0].address,
          email: customerRows[0].email,
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

  const customer = {
    id: customerRows[0].id,
    name: customerRows[0].name,
    phone: customerRows[0].phone,
    email: customerRows[0].email,
    address: customerRows[0].address,
    status: customerRows[0].status,
    totalOrders: customerRows[0].totalOrders,
    totalSpent: customerRows[0].totalSpent,
    orders: Array.from(ordersMap.values()),
    createdAt: customerRows[0].createdAt,
    updatedAt: customerRows[0].updatedAt,
  };

  res.json({
    success: true,
    message: "Lấy thông tin khách hàng thành công",
    data: customer,
  });
});

// Xuất danh sách khách hàng ra Excel
const exportCustomersToExcel = asyncHandler(async (req, res) => {
  const { keySearch, status } = req.query;

  let query = `
    SELECT 
      u.id,
      u.name,
      u.phone,
      u.email,
      u.address,
      u.status,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      COUNT(o.id) AS totalOrders,
      COALESCE(SUM(o.total_amount), 0) AS totalSpent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
  `;
  const conditions = [];
  const params = [];

  if (keySearch) {
    conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)");
    params.push(`%${keySearch}%`, `%${keySearch}%`, `%${keySearch}%`);
  }
  if (status) {
    conditions.push("u.status = ?");
    params.push(status);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " GROUP BY u.id ORDER BY u.created_at DESC";

  const [rows] = await db.execute(query, params);

  const customers = rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    status: row.status,
    totalOrders: row.totalOrders,
    totalSpent: row.totalSpent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  // Tạo workbook Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Customers");

  // Định dạng cột
  worksheet.columns = [
    { header: "Tên khách hàng", key: "name", width: 20 },
    { header: "Số điện thoại", key: "phone", width: 15 },
    { header: "Email", key: "email", width: 20 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Trạng thái", key: "status", width: 15 },
    { header: "Tổng đơn hàng", key: "totalOrders", width: 15 },
    { header: "Tổng chi tiêu", key: "totalSpent", width: 15 },
    { header: "Ngày tạo", key: "createdAt", width: 20 },
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
  customers.forEach((customer) => {
    const statusText =
      customer.status === "active" ? "Hoạt động" : "Không hoạt động";
    worksheet.addRow({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      status: statusText,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent.toLocaleString("vi-VN") + "đ",
      createdAt: new Date(customer.createdAt).toLocaleString("vi-VN"),
    });
  });

  // Thiết lập header để tải file
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");

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
  getAllCustomers,
  getCustomerById,
  exportCustomersToExcel,
  errorHandler,
};
