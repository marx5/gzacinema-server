# Gzacinema Server

Backend API cho he thong dat ve xem phim Gzacinema, su dung Node.js, Express va Sequelize.

## 1. Tech Stack

- Node.js
- Express 5
- Sequelize + MySQL
- Redis (ioredis)
- JWT (access/refresh token)
- Cloudinary + Multer (upload poster phim)
- Helmet, CORS, Cookie Parser, Morgan, Compression, Express Rate Limit

## 2. Project Structure

```text
src/
  app.js                         # Middleware va route
  server.js                      # Entry point, ket noi DB va start server
  config/                        # DB, Redis, Cloudinary
  core/
    middlewares/                 # Auth + validate middleware
    utils/                       # AppError, catchAsync
  models/                        # Sequelize models + associations
  modules/                       # Auth, User, Movie, Cinema, Room...
  seeders/                       # Du lieu mau
postman/
API_DOCS_FRONTEND.md
README.md
```

## 3. Requirements

- Node.js >= 18
- npm >= 9
- MySQL
- Redis

## 4. Installation

```bash
npm install
```

## 5. Environment Variables

Tao file `.env` o root cua project voi noi dung mau:

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

## 6. Run

Development:

```bash
npm run dev
```

Production:

```bash
npm run start
```

Sau khi chay thanh cong:

- API base: `http://localhost:5000/api`
- Ping API: `GET /api`

## 7. npm Scripts

- `npm run dev`: chay server bang nodemon
- `npm run start`: chay server bang node
- `npm test`: placeholder

## 8. Authentication

- Access token: gui qua header `Authorization: Bearer <token>`
- Refresh token: luu trong cookie `refreshToken` (HttpOnly)
- Refresh endpoint: `POST /api/auth/refresh`

## 9. Roles

- `user`: dat ve, xem/cap nhat profile
- `staff`: check-in ticket, doi trang thai ghe
- `admin`: quan ly cinema, movie, room, showtime, dashboard, danh sach booking

## 10. API Route Summary

Tat ca route duoc prefix bang `/api`.

### Public

- `GET /api`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/cinemas`
- `GET /api/cinemas/:id`
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/movies/:movieId/showtimes`
- `GET /api/payments/vnpay_ipn`

### Authenticated (verifyToken)

- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/history`
- `GET /api/rooms/cinema/:cinemaId`
- `GET /api/bookings/showtime/:showtimeId/seats`
- `POST /api/bookings/hold`
- `POST /api/bookings/unhold`
- `POST /api/payments/create-payment-url`

### Staff

- `PUT /api/rooms/:roomId/seats/:seatId`
- `PUT /api/tickets/:id/checkin`

### Admin

- `POST /api/cinemas`
- `PUT /api/cinemas/:id`
- `DELETE /api/cinemas/:id`
- `POST /api/movies`
- `PUT /api/movies/:id`
- `DELETE /api/movies/:id`
- `POST /api/rooms/:cinemaId`
- `PUT /api/rooms/:roomId`
- `DELETE /api/rooms/:roomId`
- `POST /api/showtimes`
- `GET /api/showtimes`
- `DELETE /api/showtimes/:id`
- `GET /api/bookings`
- `GET /api/statistics/dashboard`

## 11. Important Behaviors

- Rate limit toan API: 1000 requests / 15 phut / IP
- Rate limit auth: 20 requests / 15 phut / IP
- Ghe dat tam (`hold`) duoc luu Redis trong 5 phut
- Khi tao payment URL, hold ghe duoc gia han den 15 phut
- Danh sach phim va rap co cache Redis
- Server dang dung `sequelize.sync({ alter: true })` khi startup

## 12. Main Data Models

- User: full_name, email, phone_number, role(`user|staff|admin`)
- Movie: title, genre, description, duration_minutes, release_date, thumbnail, trailer_url
- Cinema: name, address
- Room: name, cinema_id
- Seat: row_letter, seat_number, type(`standard|vip|sweetbox`), status(`available|broken|maintenance`)
- Showtime: movie_id, room_id, start_time, end_time, base_price
- Booking: user_id, showtime_id, total_amount, status(`pending|paid|cancelled`)
- Ticket: booking_id, seat_id, price, status(`valid|used|refunded`)

## 13. Postman

- `postman/Gzacinema_API.postman_collection.json`
- `postman/Gzacinema_Local.postman_environment.json`

## 14. API Details

Xem tai lieu chi tiet cho frontend o file `API_DOCS_FRONTEND.md`.
