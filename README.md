# Gzacinema Server

Backend API cho hệ thống đặt vé phim Gzacinema, xây dựng với Express + Sequelize + MySQL.

## Công nghệ sử dụng

- Node.js
- Express 5
- Sequelize
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Redis (`ioredis`)
- Cloudinary + Multer
- Cookie Parser, CORS, Helmet

## Cấu trúc thư mục

```text
server/
  src/
    app.js                 # Khởi tạo middleware và route
    server.js              # Entry point, connect DB, start HTTP server
    config/                # DB, Redis, Cloudinary, Sequelize config
    core/middlewares/      # Auth middleware
    models/                # Sequelize models và associations
    modules/               # Theo domain: auth, movie, booking, ...
    seeders/               # Seeder dữ liệu mẫu
  postman/                 # Bộ sưu tập request để test API
  API_DOCS_FRONTEND.md     # Tài liệu API chi tiết cho frontend
```

## Yêu cầu hệ thống

- Node.js >= 18
- npm >= 9
- MySQL
- Redis (khuyến nghị để hỗ trợ luồng giữ ghế)

## Cài đặt

```bash
npm install
```

## Cấu hình môi trường

Tạo file `.env` trong thư mục `server`.

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gzacinema
DB_DIALECT=mysql

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay
VNP_TMNCODE=your_vnp_tmn_code
VNP_HASHSECRET=your_vnp_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/payment/success
```

## Chạy dự án

Development (hot reload với nodemon):

```bash
npm run dev
```

Production:

```bash
npm run start
```

Khi chạy thành công:
- API base: `http://localhost:5000/api`
- Health check đơn giản: `GET /api`

## Scripts

- `npm run dev`: chạy server bằng nodemon
- `npm run start`: chạy server bằng node
- `npm test`: placeholder (chưa có test)

## Cách API hoạt động

- Prefix chung: `/api`
- CORS cho phép origin từ `FRONTEND_URL` và bật `credentials`
- `refreshToken` lưu trong HttpOnly cookie
- Access token truyền qua header `Authorization: Bearer <token>`

## Nhóm route chính

- `auth`: `/api/auth`
  - `POST /register`
  - `POST /login`
  - `POST /logout`
  - `POST /refresh`
- `users`: `/api/users`
  - `GET /me`
  - `GET /history`
- `movies`: `/api/movies`
  - `POST /` (admin)
  - `GET /`
  - `GET /:id`
  - `GET /:movieId/showtimes`
  - `PUT /:id` (admin)
  - `DELETE /:id` (admin)
- `cinemas`: `/api/cinemas`
- `rooms`: `/api/rooms`
- `showtimes`: `/api/showtimes`
- `bookings`: `/api/bookings`
  - `GET /showtime/:showtimeId/seats`
  - `POST /hold`
  - `POST /unhold`
- `payments`: `/api/payments`
  - `POST /create-payment-url` (cần token)
  - `GET /vnpay_ipn` (callback)
- `tickets`: `/api/tickets`
  - `PUT /:id/checkin` (staff)
- `statistics`: `/api/statistics`
  - `GET /dashboard` (admin)

## Phân quyền

- `user`: đặt vé, xem lịch sử
- `staff`: check-in vé
- `admin`: quản trị phim/rạp/phòng/suất chiếu, xem thống kê

Middleware:
- `verifyToken`
- `verifyAdmin`
- `verifyStaff`

## Cơ sở dữ liệu

Server gọi `sequelize.sync({ alter: true })` khi khởi động trong [src/server.js](src/server.js#L10).
Điều này giúp đồng bộ schema nhanh khi phát triển, nhưng nên cân nhắc migration rõ ràng cho production.

## Tài liệu và test API

- Tài liệu frontend-facing: [API_DOCS_FRONTEND.md](API_DOCS_FRONTEND.md)
- Postman collection: [postman/Gzacinema_API.postman_collection.json](postman/Gzacinema_API.postman_collection.json)
- Postman environment: [postman/Gzacinema_Local.postman_environment.json](postman/Gzacinema_Local.postman_environment.json)

## Gợi ý khởi động nhanh local

1. Bật MySQL và tạo database `gzacinema`.
2. Bật Redis.
3. Điền `.env` theo mẫu trên.
4. Chạy `npm run dev` trong thư mục `server`.
5. Kiểm tra `GET http://localhost:5000/api` trả về `status: success`.
