import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET /categories - Lấy danh sách tất cả danh mục
router.get("/categories", async (req, res) => {
  try {
    const [categories] = await db.execute(
      "SELECT * FROM categories ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách danh mục:", error);
    res.status(500).json({
      success: false,
      error: "Không thể lấy danh sách danh mục",
      message: error.message,
    });
  }
});

export default router;
