# Seafood API với JWT Authentication và MySQL

RESTful API cho website bán hải sản được xây dựng với Node.js, Express, MySQL và JWT Authentication.

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình database
Cấu hình thông tin MySQL và JWT trong file `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=seafood_db
DB_PORT=3306
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. Thiết lập database
```bash
npm run setup
```

### 4. Chạy server
```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

## 📊 Cấu trúc Database

### Bảng `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bảng `products`
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bảng `cart_items`
```sql
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
);
```

### Bảng `orders`
```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Bảng `order_items`
```sql
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## 📋 API Endpoints

### 1. Authentication (Xác thực)

#### Đăng ký tài khoản
```
POST /auth/register
```

**Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@email.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "nguyenvana@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Đăng nhập
```
POST /auth/login
```

**Body:**
```json
{
  "email": "nguyenvana@email.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "nguyenvana@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Products (Sản phẩm)

#### Lấy danh sách sản phẩm
```
GET /products
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tôm Hùm Boston",
      "description": "Tôm hùm Boston tươi ngon...",
      "price": "850000.00",
      "image_url": "https://images.pexels.com/photos/8927369/pexels-photo-8927369.jpeg",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Lấy chi tiết sản phẩm
```
GET /products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tôm Hùm Boston",
    "description": "Tôm hùm Boston tươi ngon...",
    "price": "850000.00",
    "image_url": "https://images.pexels.com/photos/8927369/pexels-photo-8927369.jpeg",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Cart (Giỏ hàng) - Yêu cầu JWT Token

#### Xem giỏ hàng người dùng hiện tại
```
GET /cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "product_id": 1,
        "name": "Tôm Hùm Boston",
        "description": "Tôm hùm Boston tươi ngon...",
        "price": "850000.00",
        "image_url": "https://images.pexels.com/photos/8927369/pexels-photo-8927369.jpeg",
        "item_total": "1700000.00"
      }
    ],
    "totalItems": 2,
    "totalAmount": 1700000
  }
}
```

#### Thêm sản phẩm vào giỏ hàng
```
POST /cart
Authorization: Bearer <token>
```

**Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã thêm sản phẩm vào giỏ hàng",
  "data": {
    "id": 1,
    "productId": 1,
    "name": "Tôm Hùm Boston",
    "quantity": 2,
    "price": "850000.00"
  }
}
```

#### Cập nhật số lượng sản phẩm trong giỏ
```
PUT /cart/:itemId
Authorization: Bearer <token>
```

**Body:**
```json
{
  "quantity": 3
}
```

#### Xóa sản phẩm khỏi giỏ hàng
```
DELETE /cart/:itemId
Authorization: Bearer <token>
```

### 4. Orders (Đơn hàng) - Yêu cầu JWT Token

#### Tạo đơn hàng mới
```
POST /orders
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "address": "123 Đường ABC, Quận 1, TP.HCM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "orderId": 1,
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "totalAmount": 1700000,
    "items": [
      {
        "productId": 1,
        "name": "Tôm Hùm Boston",
        "quantity": 2,
        "price": "850000.00",
        "subtotal": 1700000
      }
    ]
  }
}
```

## 🧪 Test API

### Sử dụng curl

```bash
# Đăng ký tài khoản
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@email.com",
    "password": "123456"
  }'

# Đăng nhập
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@email.com",
    "password": "123456"
  }'

# Lấy danh sách sản phẩm
curl http://localhost:3000/products

# Lấy chi tiết sản phẩm
curl http://localhost:3000/products/1

# Xem giỏ hàng
curl http://localhost:3000/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Thêm vào giỏ hàng
curl -X POST http://localhost:3000/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'

# Tạo đơn hàng
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM"
  }'
```

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL với mysql2 driver
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv cho quản lý biến môi trường
- **CORS**: Hỗ trợ cross-origin requests
- **Connection Pooling**: Tối ưu hiệu suất database

## 📝 Notes

- API sử dụng JWT authentication cho bảo mật
- Các endpoint cart và orders yêu cầu token hợp lệ
- Database được thiết lập với dữ liệu mẫu
- Tất cả endpoints đều có validation và error handling
- Sử dụng MySQL transactions cho các thao tác phức tạp
- Connection pooling để tối ưu hiệu suất database
- Password được hash bằng bcrypt với salt rounds = 12
- JWT token có thời hạn 7 ngày (có thể cấu hình trong .env)
- Sau khi đặt hàng thành công, giỏ hàng được xóa tự động