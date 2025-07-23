# Seafood Admin API

RESTful API cho hệ thống quản trị website bán hải sản.

## Yêu cầu hệ thống

- Node.js (v14 trở lên)
- MySQL (v5.7 trở lên)
- npm hoặc yarn

## Cài đặt

1. **Cài đặt dependencies:**

```bash
npm install
```

2. **Thiết lập database:**
   - Tạo database MySQL
   - Import file `database/schema.sql` vào database hoặc `npm run setup`
   - Cập nhật thông tin kết nối trong file `.env`
3. **Cấu hình environment:**

   - Copy `.env` và điền thông tin database
   - Tạo JWT secret key mạnh

4. **Chạy server:**

```bash
npm start
# hoặc cho development
npm run dev
```

## API Endpoints

### Authentication

- `POST /admin/login` - Đăng nhập admin

### Products (Cần JWT token)

- `GET /admin/products` - Lấy danh sách sản phẩm
- `POST /admin/products` - Thêm sản phẩm mới
- `PUT /admin/products/:id` - Cập nhật sản phẩm
- `DELETE /admin/products/:id` - Xóa sản phẩm

### Orders (Cần JWT token)

- `GET /admin/orders` - Lấy danh sách đơn hàng
- `GET /admin/orders/:id` - Xem chi tiết đơn hàng
- `PUT /admin/orders/:id/status` - Cập nhật trạng thái đơn hàng

### Users (Cần JWT token)

- `GET /admin/users` - Lấy danh sách người dùng
- `GET /admin/users/:id` - Xem chi tiết người dùng

## Cách sử dụng

### 1. Đăng nhập Admin

```bash
POST /admin/login
Content-Type: application/json

{
  "email": "admin@seafood.com",
  "password": "admin123"
}
```

### 2. Sử dụng JWT token

Thêm header Authorization cho các API khác:

```
Authorization: Bearer <your_jwt_token>
```

### 3. Thêm sản phẩm mới

```bash
POST /admin/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tôm hùm Alaska",
  "description": "Tôm hùm tươi ngon",
  "price": 850000,
  "image_url": "https://example.com/image.jpg"
}
```

## Database Schema

### Tables:

- `admins` - Thông tin admin
- `users` - Thông tin người dùng
- `products` - Sản phẩm hải sản
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng

## Bảo mật

- Mật khẩu được mã hóa bằng bcrypt
- API được bảo vệ bằng JWT tokens
- CORS được kích hoạt cho cross-origin requests
