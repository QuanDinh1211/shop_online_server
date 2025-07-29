const db = require("../database/connection");

// Middleware để xử lý lỗi
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Lấy danh sách tất cả sản phẩm
const getAllProducts = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(
    `SELECT p.id, p.name, p.category_id, c.name AS category, p.price, p.unit_id AS unitId, u.name AS unit, p.description, p.image, p.inStock, p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON p.category_id = c.id
     JOIN units u ON p.unit_id = u.id
     ORDER BY p.created_at DESC`
  );

  res.json({
    success: true,
    message: "Lấy danh sách sản phẩm thành công",
    data: rows,
  });
});

// Lấy thông tin một sản phẩm theo ID
const getProductById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(
    `SELECT p.id, p.name, p.category_id, c.name AS category, p.price, p.unit_id AS unitId,  u.name AS unit, p.description, p.image, p.inStock, p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON p.category_id = c.id
     JOIN units u ON p.unit_id = u.id
     WHERE p.id = ?`,
    [req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy sản phẩm",
      data: null,
    });
  }

  res.json({
    success: true,
    message: "Lấy thông tin sản phẩm thành công",
    data: rows[0],
  });
});

// Tạo mới sản phẩm
const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, unit, description, image, inStock } = req.body;

  // Validate input
  if (!name || !category || !price || !unit) {
    return res.status(400).json({
      success: false,
      message: "Tên, danh mục, giá và đơn vị là bắt buộc",
      data: null,
    });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Giá phải là số dương",
      data: null,
    });
  }

  // Kiểm tra category hợp lệ và lấy category_id
  const [categoryRow] = await db.execute(
    "SELECT id FROM categories WHERE id = ?",
    [category]
  );
  if (categoryRow.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Danh mục không tồn tại",
      data: null,
    });
  }
  const category_id = categoryRow[0].id;

  // Kiểm tra unit hợp lệ và lấy unit_id
  const [unitRow] = await db.execute("SELECT id FROM units WHERE id = ?", [
    unit,
  ]);
  if (unitRow.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Đơn vị không tồn tại",
      data: null,
    });
  }
  const unit_id = unitRow[0].id;

  const [result] = await db.execute(
    "INSERT INTO products (name, category_id, price, unit_id, description, image, inStock) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      category_id,
      price,
      unit_id,
      description || "",
      image || "", // Lưu base64 trực tiếp
      inStock ?? true,
    ]
  );

  const [newProduct] = await db.execute(
    `SELECT p.id, p.name, p.category_id AS categoryId, c.name AS category, p.price, p.unit_id AS unitId, u.name AS unit, p.description, p.image, p.inStock, p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON p.category_id = c.id
     JOIN units u ON p.unit_id = u.id
     WHERE p.id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: "Tạo sản phẩm thành công",
    data: newProduct[0],
  });
});

// Cập nhật sản phẩm
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, price, unit, description, image, inStock } = req.body;

  // Kiểm tra sản phẩm tồn tại
  const [existingProduct] = await db.execute(
    "SELECT id FROM products WHERE id = ?",
    [id]
  );
  if (existingProduct.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy sản phẩm",
      data: null,
    });
  }

  // Validate input
  if (!name || !category || !price || !unit) {
    return res.status(400).json({
      success: false,
      message: "Tên, danh mục, giá và đơn vị là bắt buộc",
      data: null,
    });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Giá phải là số dương",
      data: null,
    });
  }

  // Kiểm tra category hợp lệ và lấy category_id
  const [categoryRow] = await db.execute(
    "SELECT id FROM categories WHERE id = ?",
    [category]
  );
  if (categoryRow.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Danh mục không tồn tại",
      data: null,
    });
  }
  const category_id = categoryRow[0].id;

  // Kiểm tra unit hợp lệ và lấy unit_id
  const [unitRow] = await db.execute("SELECT id FROM units WHERE id = ?", [
    unit,
  ]);
  if (unitRow.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Đơn vị không tồn tại",
      data: null,
    });
  }
  const unit_id = unitRow[0].id;

  await db.execute(
    "UPDATE products SET name = ?, category_id = ?, price = ?, unit_id = ?, description = ?, image = ?, inStock = ?, updated_at = NOW() WHERE id = ?",
    [
      name,
      category_id,
      price,
      unit_id,
      description || "",
      image || "",
      inStock === "true" ? true : false, // Chuyển từ string sang boolean
      id,
    ]
  );

  const [updatedProduct] = await db.execute(
    `SELECT p.id, p.name, p.category_id AS categoryId, c.name AS category, p.price, p.unit_id AS unitId, u.name AS unit, p.description, p.image, p.inStock, p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON p.category_id = c.id
     JOIN units u ON p.unit_id = u.id
     WHERE p.id = ?`,
    [id]
  );

  res.json({
    success: true,
    message: "Cập nhật sản phẩm thành công",
    data: updatedProduct[0],
  });
});

// Xóa sản phẩm
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kiểm tra sản phẩm tồn tại
  const [existingProduct] = await db.execute(
    "SELECT id FROM products WHERE id = ?",
    [id]
  );
  if (existingProduct.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy sản phẩm",
      data: null,
    });
  }

  await db.execute("DELETE FROM products WHERE id = ?", [id]);

  res.json({
    success: true,
    message: "Xóa sản phẩm thành công",
    data: null,
  });
});

// Xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      success: false,
      message: "Tên sản phẩm đã tồn tại",
      data: null,
    });
  }
  res.status(500).json({
    success: false,
    message: "Lỗi server nội bộ",
    data: null,
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  errorHandler,
};
