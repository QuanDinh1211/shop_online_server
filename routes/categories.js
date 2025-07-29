const express = require("express");
const router = express.Router();
const categoriesController = require("../controllers/categoriesController");

// Định nghĩa các tuyến đường
router.post("/", categoriesController.createCategory);
router.get("/", categoriesController.getAllCategories);
router.get("/:id", categoriesController.getCategoryById);
router.put("/:id", categoriesController.updateCategory);
router.delete("/:id", categoriesController.deleteCategory);

module.exports = router;
