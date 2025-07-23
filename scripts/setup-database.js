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
      database: "seafood_db", // quan trọng
    });

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
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng orders
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
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

    // Thêm admin mẫu
    await connection.execute(`
      INSERT IGNORE INTO admins (id, name, email, password) VALUES 
      (1, 'Admin User', 'admin@seafood.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V')
    `);

    // Thêm sản phẩm mẫu
    await connection.execute(`
      INSERT IGNORE INTO products (id, name, description, price, image_url) VALUES
      (1, 'Tôm hùm Alaska', 'Tôm hùm tươi nhập khẩu từ Alaska, thịt chắc ngọt', 850000, 'https://images.pexels.com/photos/5840220/pexels-photo-5840220.jpeg'),
      (2, 'Cua hoàng đế', 'Cua hoàng đế tươi sống, thịt ngọt và thơm', 1200000, 'https://images.pexels.com/photos/5677799/pexels-photo-5677799.jpeg'),
      (3, 'Cá hồi Na Uy', 'Cá hồi tươi nhập khẩu từ Na Uy, giàu omega-3', 450000, 'https://images.pexels.com/photos/3296549/pexels-photo-3296549.jpeg'),
      (4, 'Ngao sò điệp', 'Ngao sò điệp tươi sống, thịt ngọt thanh mát', 180000, 'https://images.pexels.com/photos/5677763/pexels-photo-5677763.jpeg')
    `);

    // Thêm người dùng mẫu
    await connection.execute(`
      INSERT IGNORE INTO users (id, name, email, password) VALUES 
      (1, 'Nguyễn Văn A', 'nguyenvana@email.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V'),
      (2, 'Trần Thị B', 'tranthib@email.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V')
    `);

    // Thêm đơn hàng mẫu
    await connection.execute(`
      INSERT IGNORE INTO orders (id, user_id, name, phone, address, total_amount) VALUES 
      (1, 1, 'Nguyễn Văn A', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 1300000),
      (2, 2, 'Trần Thị B', '0987654321', '456 Đường XYZ, Quận 3, TP.HCM', 630000)
    `);

    // Thêm chi tiết đơn hàng
    await connection.execute(`
      INSERT IGNORE INTO order_items (id, order_id, product_id, quantity, price) VALUES 
      (1, 1, 1, 1, 850000),
      (2, 1, 3, 1, 450000),
      (3, 2, 2, 1, 450000),
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
