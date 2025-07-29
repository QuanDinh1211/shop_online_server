import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET /products - Lấy danh sách sản phẩm (hỗ trợ lọc theo categoryId)
router.get("/", async (req, res) => {
  try {
    const { categoryId } = req.query; // Lấy query parameter categoryId
    let query = `
      SELECT p.*, c.id as category_id, c.name as category_name, u.name AS unit
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN units u ON p.unit_id = u.id
    `;
    const params = [];

    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId);
      if (!parsedCategoryId || parsedCategoryId <= 0) {
        return res.status(400).json({
          success: false,
          error: "ID danh mục không hợp lệ",
          message: "ID danh mục phải là số nguyên dương",
        });
      }
      query += " WHERE p.category_id = ?";
      params.push(parsedCategoryId);
    }

    query += " ORDER BY p.created_at DESC";

    const [products] = await db.execute(query, params);

    // Định dạng dữ liệu trả về
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Math.floor(parseFloat(product.price)), // Định dạng price thành chuỗi với 2 chữ số thập phân
      image: product.image,
      unit: product.unit,
      category: {
        id: product.category_id,
        name: product.category_name,
      },
      inStock: product.inStock,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));

    res.json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    res.status(500).json({
      success: false,
      error: "Không thể lấy danh sách sản phẩm",
      message: error.message,
    });
  }
});

// GET /products/:id - Lấy chi tiết sản phẩm
router.get("/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (!productId || productId <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID sản phẩm không hợp lệ",
        message: "ID sản phẩm phải là số nguyên dương",
      });
    }

    const [products] = await db.execute(
      `
      SELECT p.*, c.id as category_id, c.name as category_name, u.name AS unit
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN units u ON p.unit_id = u.id
      WHERE p.id = ?
      `,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Sản phẩm không tồn tại",
        message: " `Không tìm thấy sản phẩm với ID: ${productId}`.",
      });
    }

    const product = products[0];
    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Math.floor(parseFloat(product.price)), // Định dạng price
      image: product.image,
      unit: product.unit,
      category: {
        id: product.category_id,
        name: product.category_name,
      },
      inStock: product.inStock,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    res.json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({
      success: false,
      error: "Không thể lấy thông tin sản phẩm",
      message: error.message,
    });
  }
});

export default router;
