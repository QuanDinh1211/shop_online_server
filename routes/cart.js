import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /cart - Xem giỏ hàng người dùng hiện tại
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Lấy giỏ hàng với thông tin sản phẩm
    const [cartItems] = await db.execute(`
      SELECT 
        c.id,
        c.quantity,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        (c.quantity * p.price) as item_total
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);
    
    // Tính tổng tiền và số lượng
    const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.item_total), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      data: {
        items: cartItems,
        totalItems,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      }
    });
    
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy thông tin giỏ hàng',
      message: error.message
    });
  }
});

// POST /cart - Thêm sản phẩm vào giỏ hàng
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc',
        message: 'productId là bắt buộc'
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Số lượng không hợp lệ',
        message: 'Số lượng phải lớn hơn 0'
      });
    }
    
    // Kiểm tra sản phẩm có tồn tại
    const [products] = await db.execute(
      'SELECT id, name, price FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sản phẩm không tồn tại',
        message: `Không tìm thấy sản phẩm với ID: ${productId}`
      });
    }
    
    const product = products[0];
    
    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const [existingItems] = await db.execute(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    if (existingItems.length > 0) {
      // Cập nhật số lượng nếu đã có
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;
      
      await db.execute(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItem.id]
      );
      
      res.json({
        success: true,
        message: 'Đã cập nhật số lượng sản phẩm trong giỏ hàng',
        data: {
          id: existingItem.id,
          productId: product.id,
          name: product.name,
          oldQuantity: existingItem.quantity,
          newQuantity,
          addedQuantity: quantity
        }
      });
      
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      const [result] = await db.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
      
      res.status(201).json({
        success: true,
        message: 'Đã thêm sản phẩm vào giỏ hàng',
        data: {
          id: result.insertId,
          productId: product.id,
          name: product.name,
          quantity,
          price: product.price
        }
      });
    }
    
  } catch (error) {
    console.error('Lỗi thêm vào giỏ hàng:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể thêm sản phẩm vào giỏ hàng',
      message: error.message
    });
  }
});

// PUT /cart/:itemId - Cập nhật số lượng sản phẩm trong giỏ
router.put('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Số lượng không hợp lệ',
        message: 'Số lượng phải lớn hơn 0'
      });
    }
    
    // Kiểm tra cart item có thuộc về user không
    const [cartItems] = await db.execute(`
      SELECT 
        c.id, c.user_id, c.product_id, c.quantity as current_quantity,
        p.name
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [itemId, userId]);
    
    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sản phẩm không tồn tại trong giỏ hàng',
        message: 'Không tìm thấy sản phẩm này trong giỏ hàng của bạn'
      });
    }
    
    const cartItem = cartItems[0];
    
    // Cập nhật số lượng
    await db.execute(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, itemId]
    );
    
    res.json({
      success: true,
      message: 'Đã cập nhật số lượng sản phẩm',
      data: {
        id: parseInt(itemId),
        name: cartItem.name,
        oldQuantity: cartItem.current_quantity,
        newQuantity: quantity
      }
    });
    
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật giỏ hàng',
      message: error.message
    });
  }
});

// DELETE /cart/:itemId - Xóa sản phẩm khỏi giỏ
router.delete('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra cart item có thuộc về user không
    const [cartItems] = await db.execute(`
      SELECT 
        c.id, c.quantity,
        p.name
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.user_id = ?
    `, [itemId, userId]);
    
    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sản phẩm không tồn tại trong giỏ hàng',
        message: 'Không tìm thấy sản phẩm này trong giỏ hàng của bạn'
      });
    }
    
    const cartItem = cartItems[0];
    
    // Xóa item khỏi giỏ hàng
    await db.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [itemId, userId]);
    
    res.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: {
        id: parseInt(itemId),
        name: cartItem.name,
        quantity: cartItem.quantity
      }
    });
    
  } catch (error) {
    console.error('Lỗi xóa khỏi giỏ hàng:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa sản phẩm khỏi giỏ hàng',
      message: error.message
    });
  }
});

export default router;