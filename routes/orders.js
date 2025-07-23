const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');

const router = express.Router();

// Apply auth middleware to all order routes
router.use(authMiddleware);

// Order routes
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

module.exports = router;