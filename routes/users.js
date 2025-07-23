const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getAllUsers,
  getUserById
} = require('../controllers/userController');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

// User routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);

module.exports = router;