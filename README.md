# Seafood API với JWT Authentication và MySQL

RESTful API cho website bán hải sản, được xây dựng với Node.js, Express, MySQL và JWT Authentication. API hỗ trợ quản lý người dùng, admin, sản phẩm, danh mục, giỏ hàng, và đơn hàng.

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình database

Tạo file `.env` trong thư mục gốc và cấu hình thông tin MySQL và JWT:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=seafood_admin
DB_PORT=3306
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. Thiết lập database

Chạy script để tạo database và thêm dữ liệu mẫu:

```bash
npm run setup
```

### 4. Chạy server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

## 📊 Cấu trúc Database

### Bảng `categories`

```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bảng `admins`

```sql
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

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
  image VARCHAR(500),
  unit VARCHAR(50) NOT NULL,
  category_id INT NOT NULL,
  inStock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
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
  total_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## 📋 API Endpoints

### 1. Authentication (Xác thực)

#### Đăng ký tài khoản (Người dùng)

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
      "email": "nguyenvana@email.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Đăng nhập (Người dùng hoặc Admin)

```
POST /auth/login
```

**Body:**

```json
{
  "email": "admin@seafood.com",
  "password": "admin123"
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
      "name": "Admin User",
      "email": "admin@seafood.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Categories (Danh mục)

#### Lấy danh sách danh mục

```
GET /categories
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tôm",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    },
    ...
  ]
}
```

### 3. Products (Sản phẩm)

#### Lấy danh sách sản phẩm (Hỗ trợ lọc theo danh mục)

```
GET /products?categoryId=3
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "name": "Cá Ngừ Đại Dương",
      "description": "Cá ngừ đại dương tươi ngon, thịt đỏ tự nhiên, giàu dinh dưỡng.",
      "price": "520000.00",
      "image": "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg",
      "unit": "kg",
      "category": {
        "id": 3,
        "name": "Cá"
      },
      "inStock": true,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    },
    ...
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
    "id": 8,
    "name": "Cá Ngừ Đại Dương",
    "description": "Cá ngừ đại dương tươi ngon, thịt đỏ tự nhiên, giàu dinh dưỡng.",
    "price": "520000.00",
    "image": "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg",
    "unit": "kg",
    "category": {
      "id": 3,
      "name": "Cá"
    },
    "inStock": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Thêm sản phẩm (Chỉ admin, yêu cầu JWT)

```
POST /products
Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "name": "Cá Ngừ Đại Dương",
  "description": "Cá ngừ đại dương tươi ngon, thịt đỏ tự nhiên, giàu dinh dưỡng.",
  "price": 520000,
  "image": "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg",
  "unit": "kg",
  "categoryId": 3,
  "inStock": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Thêm sản phẩm thành công",
  "data": {
    "id": 8,
    "name": "Cá Ngừ Đại Dương",
    ...
  }
}
```

#### Cập nhật sản phẩm (Chỉ admin, yêu cầu JWT)

```
PUT /products/:id
Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "name": "Cá Ngừ Đại Dương",
  "description": "Cá ngừ đại dương tươi ngon, thịt đỏ tự nhiên, giàu dinh dưỡng.",
  "price": 520000,
  "image": "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg",
  "unit": "kg",
  "categoryId": 3,
  "inStock": true
}
```

#### Xóa sản phẩm (Chỉ admin, yêu cầu JWT)

```
DELETE /products/:id
Authorization: Bearer <admin_token>
```

### 4. Cart (Giỏ hàng) - Yêu cầu JWT Token

#### Xem giỏ hàng

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
        "name": "Tôm Hùm Alaska",
        "description": "Tôm hùm tươi nhập khẩu từ Alaska, thịt chắc ngọt",
        "price": "850000.00",
        "image": "https://images.pexels.com/photos/5840220/pexels-photo-5840220.jpeg",
        "unit": "kg",
        "category": {
          "id": 5,
          "name": "Tôm hùm"
        },
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

#### Cập nhật số lượng sản phẩm

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

### 5. Orders (Đơn hàng) - Yêu cầu JWT Token

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
    "status": "pending",
    "items": [
      {
        "productId": 1,
        "name": "Tôm Hùm Alaska",
        "quantity": 2,
        "price": "850000.00",
        "subtotal": 1700000,
        "category": {
          "id": 5,
          "name": "Tôm hùm"
        }
      }
    ]
  }
}
```

#### Lấy danh sách đơn hàng (Admin, yêu cầu JWT)

```
GET /admin/orders
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "total_amount": "1700000.00",
      "status": "pending",
      "items": [
        {
          "product_id": 1,
          "name": "Tôm Hùm Alaska",
          "quantity": 2,
          "price": "850000.00",
          "subtotal": 1700000,
          "category": {
            "id": 5,
            "name": "Tôm hùm"
          }
        }
      ]
    }
  ]
}
```

#### Cập nhật trạng thái đơn hàng (Admin, yêu cầu JWT)

```
PUT /admin/orders/:id
Authorization: Bearer <admin_token>
```

**Body:**

```json
{
  "status": "confirmed"
}
```

## 🧪 Test API

### Sử dụng curl

```bash
# Đăng ký tài khoản
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Nguyễn Văn A", "email": "nguyenvana@email.com", "password": "123456"}'

# Đăng nhập
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@seafood.com", "password": "admin123"}'

# Lấy danh sách danh mục
curl http://localhost:3000/categories

# Lấy danh sách sản phẩm
curl http://localhost:3000/products?categoryId=3

# Thêm sản phẩm (Admin)
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cá Ngừ Đại Dương", "description": "Cá ngừ đại dương tươi ngon, thịt đỏ tự nhiên, giàu dinh dưỡng.", "price": 520000, "image": "https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg", "unit": "kg", "categoryId": 3, "inStock": true}'

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
  -d '{"name": "Nguyễn Văn A", "phone": "0123456789", "address": "123 Đường ABC, Quận 1, TP.HCM"}'

# Lấy danh sách đơn hàng (Admin)
curl http://localhost:3000/admin/orders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL với `mysql2` driver (hỗ trợ connection pooling)
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: `bcryptjs` (salt rounds = 12)
- **Environment**: `dotenv` cho quản lý biến môi trường
- **CORS**: Hỗ trợ cross-origin requests
- **Validation**: Sử dụng `express-validator` cho kiểm tra dữ liệu đầu vào
- **Transactions**: MySQL transactions cho các thao tác phức tạp (như tạo đơn hàng)

## 📝 Notes

- API sử dụng JWT authentication để bảo mật các endpoint nhạy cảm.
- Các endpoint `/cart`, `/orders`, và `/admin/*` yêu cầu token hợp lệ.
- Endpoint `/products` hỗ trợ lọc sản phẩm theo danh mục (`categoryId`).
- Admin có thể quản lý sản phẩm và đơn hàng qua các endpoint `/products` và `/admin/orders`.
- Password được hash bằng `bcrypt` với salt rounds = 12.
- JWT token có thời hạn 7 ngày (có thể cấu hình trong `.env`).
- Sau khi đặt hàng thành công, giỏ hàng của người dùng sẽ được xóa tự động.
- Database được thiết lập với dữ liệu mẫu (admin, users, categories, products, orders, order_items).
