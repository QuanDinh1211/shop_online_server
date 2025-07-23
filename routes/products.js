const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const router = express.Router();

// Apply auth middleware to all product routes
router.use(authMiddleware);

// Product routes
router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;