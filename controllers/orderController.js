const db = require('../database/connection');

const getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        o.id,
        o.user_id,
        o.name,
        o.phone,
        o.address,
        o.total_amount,
        o.status,
        o.created_at,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    const [orderRows] = await db.execute(`
      SELECT 
        o.id,
        o.user_id,
        o.name,
        o.phone,
        o.address,
        o.total_amount,
        o.status,
        o.created_at,
        u.email as user_email,
        u.name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const [itemRows] = await db.execute(`
      SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    const order = {
      ...orderRows[0],
      items: itemRows
    };

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, confirmed, shipped, delivered, cancelled)'
      });
    }

    // Check if order exists
    const [existingOrder] = await db.execute(
      'SELECT id FROM orders WHERE id = ?',
      [id]
    );

    if (existingOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await db.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus
};