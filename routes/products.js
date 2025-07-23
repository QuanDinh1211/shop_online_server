import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /products - Lấy danh sách sản phẩm
router.get('/', async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách sản phẩm',
      message: error.message
    });
  }
});

// GET /products/:id - Lấy chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (!productId || productId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID sản phẩm không hợp lệ',
        message: 'ID sản phẩm phải là số nguyên dương'
      });
    }
    
    const [products] = await db.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sản phẩm không tồn tại',
        message: `Không tìm thấy sản phẩm với ID: ${productId}`
      });
    }
    
    res.json({
      success: true,
      data: products[0]
    });
    
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy thông tin sản phẩm',
      message: error.message
    });
  }
});

export default router;