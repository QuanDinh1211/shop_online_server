import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
  let connection;
  
  try {
    // Kết nối MySQL mà không chỉ định database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔄 Đang thiết lập cơ sở dữ liệu...');

    // Tạo database nếu chưa tồn tại
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'seafood_db'}`);
    await connection.execute(`USE ${process.env.DB_NAME || 'seafood_db'}`);

    // Tạo bảng users
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
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
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng cart_items
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
      )
    `);

    // Tạo bảng orders
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tạo bảng order_items
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tạo bảng thành công!');

    // Thêm dữ liệu mẫu cho products
    await connection.execute(`
      INSERT IGNORE INTO products (id, name, description, price, image_url) VALUES
      (1, 'Tôm Hùm Boston', 'Tôm hùm Boston tươi ngon, thịt ngọt và chắc. Phù hợp cho các món nướng, hấp hoặc làm salad.', 850000.00, 'https://images.pexels.com/photos/8927369/pexels-photo-8927369.jpeg'),
      (2, 'Cá Hồi Na Uy', 'Cá hồi Na Uy tươi, giàu omega-3. Thích hợp cho sashimi, nướng hoặc làm các món Âu.', 320000.00, 'https://images.pexels.com/photos/3296287/pexels-photo-3296287.jpeg'),
      (3, 'Cua Hoàng Đế Alaska', 'Cua hoàng đế Alaska cao cấp, thịt ngọt và nhiều. Món ăn sang trọng cho dịp đặc biệt.', 1200000.00, 'https://images.pexels.com/photos/5779280/pexels-photo-5779280.jpeg'),
      (4, 'Tôm Thẻ Jumbo', 'Tôm thẻ jumbo size lớn, tươi ngon. Thích hợp cho các món nướng, chiên tempura.', 450000.00, 'https://images.pexels.com/photos/8927334/pexels-photo-8927334.jpeg'),
      (5, 'Mực Ống Tươi', 'Mực ống tươi ngon, thịt ngọt và dai giòn. Phù hợp cho món nướng, xào hoặc nhồi thịt.', 180000.00, 'https://images.pexels.com/photos/8927337/pexels-photo-8927337.jpeg'),
      (6, 'Sò Điệp Lớn', 'Sò điệp lớn tươi ngon, thịt ngọt và mềm. Thích hợp cho món nướng mỡ hành hoặc hấp gừng.', 280000.00, 'https://images.pexels.com/photos/5779282/pexels-photo-5779282.jpeg'),
      (7, 'Cá Ngừ Đại Dương', 'Cá ngừ đại dương tươi ngon, thịt đỏ chắc. Tuyệt vời cho sashimi và các món nướng.', 380000.00, 'https://images.pexels.com/photos/3296291/pexels-photo-3296291.jpeg'),
      (8, 'Bạch Tuộc Baby', 'Bạch tuộc baby tươi ngon, thịt mềm và ngọt. Phù hợp cho các món nướng, xào hoặc nấu soup.', 220000.00, 'https://images.pexels.com/photos/8927335/pexels-photo-8927335.jpeg')
    `);

    console.log('✅ Thêm dữ liệu mẫu thành công!');
    console.log('🎉 Thiết lập cơ sở dữ liệu hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi thiết lập database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupDatabase();