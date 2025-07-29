const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const setupAdminDatabase = async () => {
  let connection;

  try {
    // Kết nối ban đầu (chưa có database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 3306,
    });

    console.log("🔧 Đang thiết lập cơ sở dữ liệu admin...");

    // Tạo database nếu chưa có
    await connection.execute(`CREATE DATABASE IF NOT EXISTS seafood_db`);
    await connection.end();

    // Kết nối lại với database đã tạo
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 3306,
      database: "seafood_db",
    });

    // Tạo bảng categories
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng units
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng admins
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng password_reset_codes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng users
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng products
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        unit_id INT NOT NULL,
        category_id INT NOT NULL,
        inStock BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT
      )
    `);

    // Tạo bảng orders
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        order_code VARCHAR(32) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        notes TEXT,
        payment_method VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) DEFAULT 0,
        status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Tạo bảng order_items
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Thêm danh mục mẫu
    await connection.execute(`
      INSERT IGNORE INTO categories (id, name) VALUES 
      (1, 'Tôm'),
      (2, 'Cua'),
      (3, 'Cá'),
      (4, 'Mực'),
      (5, 'Tôm hùm'),
      (6, 'Sò')
    `);

    // Thêm đơn vị mẫu
    await connection.execute(`
      INSERT IGNORE INTO units (id, name) VALUES 
      (1, 'kg'),
      (2, 'con'),
      (3, 'lít')
    `);

    // Thêm admin mẫu
    await connection.execute(`
      INSERT IGNORE INTO admins (id, name, email, password) VALUES 
      (1, 'Admin User', 'admin@seafood.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V')
    `);

    // Thêm người dùng mẫu
    await connection.execute(`
      INSERT IGNORE INTO users (id, name, email, password) VALUES 
      (1, 'Nguyễn Văn A', 'nguyenvana@email.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V'),
      (2, 'Trần Thị B', 'tranthib@email.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V')
    `);

    // Thêm sản phẩm mẫu
    await connection.execute(`
      INSERT IGNORE INTO products (id, name, description, price, image, unit_id, category_id, inStock) VALUES
      (1, 'Tôm hùm Alaska', 'Tôm hùm tươi nhập khẩu từ Alaska, thịt chắc ngọt', 850000, 'https://images.pexels.com/photos/5840220/pexels-photo-5840220.jpeg', 1, 5, TRUE),
      (2, 'Cua hoàng đế', 'Cua hoàng đế tươi sống, thịt ngọt và thơm', 1200000, 'https://images.pexels.com/photos/5677799/pexels-photo-5677799.jpeg', 1, 2, TRUE),
      (3, 'Cá hồi Na Uy', 'Cá hồi tươi nhập khẩu từ Na Uy, giàu omega-3', 450000, 'https://images.pexels.com/photos/3296549/pexels-photo-3296549.jpeg', 1, 3, TRUE),
      (4, 'Ngao sò điệp', 'Ngao sò điệp tươi sống, thịt ngọt thanh mát', 180000, 'https://images.pexels.com/photos/5677763/pexels-photo-5677763.jpeg', 1, 6, TRUE),
      (5, 'Tôm Sú Tươi', 'Tôm sú tươi ngon, size lớn, được nuôi trong môi trường sạch.', 320000, 'https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg', 1, 1, TRUE),
      (6, 'Cá Ngừ Đại Dương', 'Cá ngừ đại dương tươi ngon, thịt đỏ tự nhiên, giàu dinh dưỡng.', 520000, 'https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg', 1, 3, TRUE)
    `);

    // Thêm đơn hàng mẫu
    await connection.execute(`
      INSERT IGNORE INTO orders (id, user_id, order_code, name, phone, address, total_amount, payment_method) VALUES 
      (1, 1, 'ORD001', 'Nguyễn Văn A', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 1370000, 'COD'),
      (2, 2, 'ORD002', 'Trần Thị B', '0987654321', '456 Đường XYZ, Quận 3, TP.HCM', 700000, 'COD')
    `);

    // Thêm chi tiết đơn hàng
    await connection.execute(`
      INSERT IGNORE INTO order_items (id, order_id, product_id, quantity, price) VALUES 
      (1, 1, 1, 1, 850000),
      (2, 1, 6, 1, 520000),
      (3, 2, 3, 1, 450000),
      (4, 2, 4, 1, 180000)
    `);

    console.log("✅ Thiết lập database admin thành công!");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    if (connection) await connection.end();
  }
};

setupAdminDatabase();
