# Gzacinema Server

Backend API cho hệ thống đặt vé xem phim Gzacinema, sử dụng Node.js, Express và Sequelize.

## 1. Tech Stack

- Node.js + Express 5
- Sequelize + MySQL
- Redis (ioredis)
- JWT (access token + refresh token)
- Cloudinary + Multer (upload poster)
- VNPay payment gateway
- Socket.IO (realtime seat status)
- Helmet, CORS, Cookie Parser, Morgan, Compression, Express Rate Limit

## 2. Project Structure

```text
src/
  app.js                         # Global middleware, rate limit, mount route
  server.js                      # HTTP server, Socket.IO, DB start, cron start
  config/                        # config.js, database.js, redis.js, cloudinary.js
  core/
    cron/cleanup.js              # Cleanup booking pending quá 15 phút
    middlewares/                 # auth middleware, validate middleware
    utils/                       # AppError, catchAsync
  models/                        # Sequelize models + associations
  modules/
    auth/
    user/
    cinema/
    movie/
    room/
    showtime/
    booking/
    payment/
    ticket/
    statistic/
  seeders/
migrations/
postman/
README.md
API_DOCS_FRONTEND.md
```

## 3. Requirements

- Node.js >= 18
- npm >= 9
- MySQL
- Redis

## 4. Quick Start

1. Cài dependencies:

```bash
npm install
```

2. Tạo file .env theo mẫu ở mục Environment Variables.

3. Khởi động MySQL và Redis.

4. Chạy server:

```bash
npm run dev
```

5. Kiểm tra health:

- GET /api
- Base URL local: http://localhost:5000/api

## 5. Environment Variables

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

## 6. npm Scripts

- npm run dev: chạy server bằng nodemon
- npm run start: chạy server bằng node
- npm test: placeholder

## 7. Authentication

- Access token: gửi qua header Authorization: Bearer <token>
- Refresh token: server set vào cookie refreshToken (httpOnly)
- Refresh endpoint: POST /api/auth/refresh

## 8. Authorization (Role)

- user: đặt vé, xem/cập nhật profile, giữ/bỏ giữ ghế
- staff: check-in ticket, update trạng thái ghế
- admin: quản lý cinema, movie, room, showtime, booking, dashboard

Lưu ý:
- verifyStaff cho phép cả staff và admin
- statistic và showtime admin routes dùng verifyToken + verifyAdmin

## 9. API Route Summary

Tất cả route có prefix /api.

### Public

- GET /api
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/cinemas
- GET /api/cinemas/:id
- GET /api/movies
- GET /api/movies/:id
- GET /api/movies/:movieId/showtimes
- GET /api/payments/vnpay_ipn

### Authenticated (verifyToken)

- GET /api/users/me
- PUT /api/users/me
- GET /api/users/history
- GET /api/rooms/cinema/:cinemaId
- GET /api/bookings/showtime/:showtimeId/seats
- POST /api/bookings/hold
- POST /api/bookings/unhold
- POST /api/payments/create-payment-url

### Staff/Admin

- PUT /api/rooms/:roomId/seats/:seatId
- PUT /api/tickets/:id/checkin

### Admin only

- POST /api/cinemas
- PUT /api/cinemas/:id
- DELETE /api/cinemas/:id
- POST /api/movies
- PUT /api/movies/:id
- DELETE /api/movies/:id
- POST /api/rooms/:cinemaId
- PUT /api/rooms/:roomId
- DELETE /api/rooms/:roomId
- POST /api/showtimes
- GET /api/showtimes
- DELETE /api/showtimes/:id
- GET /api/bookings
- GET /api/statistics/dashboard

## 10. Runtime Behaviors

### 10.1 Rate Limit

- General limiter: 5000 request / 15 phút / IP
- Auth limiter: 20 request / 15 phút / IP
- Booking limiter: 50 request lỗi / 15 phút / IP (skipSuccessfulRequests)
- Payment limiter: 30 request lỗi / 15 phút / IP (skipSuccessfulRequests)

### 10.2 Booking Hold Seat

- Redis key: hold_seat:{showtimeId}:{seatId}
- TTL hold mặc định: 300 giây (5 phút)
- Nếu user đã hold ghế đó, request hold sẽ gia hạn TTL
- Khi tạo payment URL, hold seat được gia hạn TTL lên 15 phút

### 10.3 Payment VNPay

- Endpoint tạo URL thanh toán: POST /api/payments/create-payment-url
- Server tạo Booking pending + Ticket valid trước khi redirect VNPay
- VNPay IPN callback: GET /api/payments/vnpay_ipn
- Nếu thành công (vnp_ResponseCode=00): booking paid, xóa redis hold
- Nếu thất bại: booking cancelled, ticket refunded, xóa redis hold

### 10.4 Realtime Seat Updates (Socket.IO)

- Client join room theo showtimeId qua event join_showtime
- Client leave room qua event leave_showtime
- Server emit seat_status_changed khi ghế đổi trạng thái:
  - held
  - available
  - booked

### 10.5 Cron Cleanup

- Job chạy mỗi phút (node-cron)
- Dọn dẹp booking pending tạo quá 15 phút => đổi sang cancelled

### 10.6 Redis Cache

- Cinema list cache: key cache:cinemas, TTL 24h
- Movie list cache theo query: key cache:movies:{status}:{page}:{limit}, TTL 1h
- Dashboard cache: key dashboard:stats:{startDate}:{endDate}:{cinemaId}, TTL 5 phút

## 11. Database Sync and Migrations

- Startup đang dùng sequelize.sync({ alter: false })
- Nghĩa là server không tự động alter schema
- Nên quản lý schema bằng migration trong folder migrations

## 12. Main Data Models

- User: full_name, email, phone_number, role (user|staff|admin)
- Movie: title, genre, description, duration_minutes, release_date, thumbnail, trailer_url
- Cinema: name, address
- Room: name, cinema_id
- Seat: row_letter, seat_number, type (standard|vip|sweetbox), status (available|broken|maintenance)
- Showtime: movie_id, room_id, start_time, end_time, base_price
- Booking: user_id, showtime_id, total_amount, status (pending|paid|cancelled)
- Ticket: booking_id, seat_id, price, status (valid|used|refunded)

## 13. Postman

- postman/Gzacinema_API.postman_collection.json
- postman/Gzacinema_Local.postman_environment.json

## 14. API Detail Doc

Xem file API_DOCS_FRONTEND.md để có request/response sample chi tiết cho frontend.
