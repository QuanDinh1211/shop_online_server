const db = require('../database/connection');

const getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, description, price, image_url, created_at FROM products ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;

    // Validate input
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)',
      [name, description || '', price, image_url || '']
    );

    const [newProduct] = await db.execute(
      'SELECT id, name, description, price, image_url, created_at FROM products WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url } = req.body;

    // Check if product exists
    const [existingProduct] = await db.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate input
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    await db.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?',
      [name, description || '', price, image_url || '', id]
    );

    const [updatedProduct] = await db.execute(
      'SELECT id, name, description, price, image_url, created_at FROM products WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existingProduct] = await db.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await db.execute('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};