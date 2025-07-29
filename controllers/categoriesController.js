const db = require("../database/connection");

// Middleware để xử lý lỗi
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Tạo mới category
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục là bắt buộc",
      data: null,
    });
  }

  const [result] = await db.execute(
    "INSERT INTO categories (name) VALUES (?)",
    [name]
  );

  const [newCategory] = await db.execute(
    "SELECT * FROM categories WHERE id = ?",
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: "Tạo danh mục thành công",
    data: newCategory[0],
  });
});

// Lấy danh sách tất cả categories
const getAllCategories = asyncHandler(async (req, res) => {
  const [categories] = await db.execute(
    "SELECT * FROM categories ORDER BY created_at DESC"
  );

  res.json({
    success: true,
    message: "Lấy danh sách danh mục thành công",
    data: categories,
  });
});

// Lấy thông tin một category theo ID
const getCategoryById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM categories WHERE id = ?", [
    req.params.id,
  ]);

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
      data: null,
    });
  }

  res.json({
    success: true,
    message: "Lấy thông tin danh mục thành công",
    data: rows[0],
  });
});

// Cập nhật category
const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục là bắt buộc",
      data: null,
    });
  }

  const [result] = await db.execute(
    "UPDATE categories SET name = ?, updated_at = NOW() WHERE id = ?",
    [name, req.params.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
      data: null,
    });
  }

  const [updated] = await db.execute("SELECT * FROM categories WHERE id = ?", [
    req.params.id,
  ]);

  res.json({
    success: true,
    message: "Cập nhật danh mục thành công",
    data: updated[0],
  });
});

// Xóa category
const deleteCategory = asyncHandler(async (req, res) => {
  const [result] = await db.execute("DELETE FROM categories WHERE id = ?", [
    req.params.id,
  ]);

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Xóa danh mục thành công",
    data: null,
  });
});

// Xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục đã tồn tại",
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
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  errorHandler,
};
