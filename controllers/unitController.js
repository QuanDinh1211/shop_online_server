const db = require("../database/connection");

// Middleware để xử lý lỗi
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Tạo mới unit
const createUnit = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên đơn vị là bắt buộc",
      data: null,
    });
  }

  const [result] = await db.execute("INSERT INTO units (name) VALUES (?)", [
    name,
  ]);

  const [newUnit] = await db.execute("SELECT * FROM units WHERE id = ?", [
    result.insertId,
  ]);

  res.status(201).json({
    success: true,
    message: "Tạo đơn vị thành công",
    data: newUnit[0],
  });
});

// Lấy danh sách tất cả units
const getAllUnits = asyncHandler(async (req, res) => {
  const [units] = await db.execute(
    "SELECT * FROM units ORDER BY created_at DESC"
  );

  res.json({
    success: true,
    message: "Lấy danh sách đơn vị thành công",
    data: units,
  });
});

// Lấy thông tin một unit theo ID
const getUnitById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM units WHERE id = ?", [
    req.params.id,
  ]);

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn vị",
      data: null,
    });
  }

  res.json({
    success: true,
    message: "Lấy thông tin đơn vị thành công",
    data: rows[0],
  });
});

// Cập nhật unit
const updateUnit = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên đơn vị là bắt buộc",
      data: null,
    });
  }

  const [result] = await db.execute(
    "UPDATE units SET name = ?, updated_at = NOW() WHERE id = ?",
    [name, req.params.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn vị",
      data: null,
    });
  }

  const [updated] = await db.execute("SELECT * FROM units WHERE id = ?", [
    req.params.id,
  ]);

  res.json({
    success: true,
    message: "Cập nhật đơn vị thành công",
    data: updated[0],
  });
});

// Xóa unit
const deleteUnit = asyncHandler(async (req, res) => {
  // Kiểm tra xem unit có được sử dụng trong products không
  const [products] = await db.execute(
    "SELECT COUNT(*) as count FROM products WHERE unit_id = ?",
    [req.params.id]
  );
  if (products[0].count > 0) {
    return res.status(400).json({
      success: false,
      message: "Không thể xóa đơn vị vì có sản phẩm liên kết",
      data: null,
    });
  }

  const [result] = await db.execute("DELETE FROM units WHERE id = ?", [
    req.params.id,
  ]);

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn vị",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Xóa đơn vị thành công",
    data: null,
  });
});

// Xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      success: false,
      message: "Tên đơn vị đã tồn tại",
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
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  errorHandler,
};
