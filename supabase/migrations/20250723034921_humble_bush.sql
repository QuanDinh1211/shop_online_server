-- Seafood Admin Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS seafood_admin;
USE seafood_admin;

-- Admins table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
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
);

-- Order items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample admin (password: admin123)
INSERT INTO admins (name, email, password) VALUES 
('Admin User', 'admin@seafood.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V');

-- Insert sample products
INSERT INTO products (name, description, price, image_url) VALUES 
('Tôm hùm Alaska', 'Tôm hùm tươi nhập khẩu từ Alaska, thịt chắc ngọt', 850000, 'https://images.pexels.com/photos/5840220/pexels-photo-5840220.jpeg'),
('Cua hoàng đế', 'Cua hoàng đế tươi sống, thịt ngọt và thơm', 1200000, 'https://images.pexels.com/photos/5677799/pexels-photo-5677799.jpeg'),
('Cá hồi Na Uy', 'Cá hồi tươi nhập khẩu từ Na Uy, giàu omega-3', 450000, 'https://images.pexels.com/photos/3296549/pexels-photo-3296549.jpeg'),
('Ngao sò điệp', 'Ngao sò điệp tươi sống, thịt ngọt thanh mát', 180000, 'https://images.pexels.com/photos/5677763/pexels-photo-5677763.jpeg');

-- Insert sample users
INSERT INTO users (name, email, password) VALUES 
('Nguyễn Văn A', 'nguyenvana@email.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V'),
('Trần Thị B', 'tranthib@email.com', '$2a$10$rQ7gHkHU8i1VH7YzEq9VduKyNhFJ8QZjKlIHrF3Lz7oX9VH7YzEq9V');

-- Insert sample orders
INSERT INTO orders (user_id, name, phone, address, total_amount) VALUES 
(1, 'Nguyễn Văn A', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 1300000),
(2, 'Trần Thị B', '0987654321', '456 Đường XYZ, Quận 3, TP.HCM', 630000);

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
(1, 1, 1, 850000),
(1, 3, 1, 450000),
(2, 2, 1, 450000),
(2, 4, 1, 180000);