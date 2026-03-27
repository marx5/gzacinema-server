# Gzacinema Backend API Docs (Frontend)

Tài liệu này được cập nhật theo source code hiện tại.
Tất cả endpoint đều có base path: /api.

## 1. General

- Success response thường có status: success
- Error response thường có status: error hoặc status: fail
- Access token gửi qua header:

```http
Authorization: Bearer <access_token>
```

- Refresh token được server set trong cookie refreshToken khi login
- Cookie refresh token là httpOnly

## 2. Auth Middleware và Role

- verifyToken: yêu cầu token hợp lệ
- verifyAdmin: chỉ role admin
- verifyStaff: role staff hoặc admin

Role mapping:
- user: đặt vé, cập nhật profile, xem lịch sử
- staff: check-in ticket, cập nhật trạng thái ghế
- admin: quản trị toàn bộ module + xem thống kê

## 3. Rate Limit

- General (phía app): 5000 req / 15 phút / IP
- Auth routes: 20 req / 15 phút / IP
- Booking routes: 50 req lỗi / 15 phút / IP (skip successful requests)
- Payment routes: 30 req lỗi / 15 phút / IP (skip successful requests)

## 4. Endpoint List

### 4.1 System

1. GET /api

### 4.2 Auth

1. POST /api/auth/register
2. POST /api/auth/login
3. POST /api/auth/logout
4. POST /api/auth/refresh

### 4.3 Users (verifyToken)

1. GET /api/users/me
2. PUT /api/users/me
3. GET /api/users/history

### 4.4 Cinemas

1. POST /api/cinemas (admin)
2. GET /api/cinemas
3. GET /api/cinemas/:id
4. PUT /api/cinemas/:id (admin)
5. DELETE /api/cinemas/:id (admin)

### 4.5 Movies

1. POST /api/movies (admin, multipart/form-data)
2. GET /api/movies
3. GET /api/movies/:id
4. GET /api/movies/:movieId/showtimes
5. PUT /api/movies/:id (admin, multipart/form-data)
6. DELETE /api/movies/:id (admin)

### 4.6 Rooms (verifyToken)

1. POST /api/rooms/:cinemaId (admin)
2. GET /api/rooms/cinema/:cinemaId
3. PUT /api/rooms/:roomId (admin)
4. DELETE /api/rooms/:roomId (admin)
5. PUT /api/rooms/:roomId/seats/:seatId (staff/admin)

### 4.7 Showtimes (verifyToken + admin)

1. POST /api/showtimes
2. GET /api/showtimes
3. DELETE /api/showtimes/:id

### 4.8 Bookings (verifyToken)

1. GET /api/bookings/showtime/:showtimeId/seats
2. POST /api/bookings/hold
3. POST /api/bookings/unhold
4. GET /api/bookings (admin)

### 4.9 Payments

1. POST /api/payments/create-payment-url (verifyToken)
2. GET /api/payments/vnpay_ipn (public callback)

### 4.10 Tickets

1. PUT /api/tickets/:id/checkin (staff/admin)

### 4.11 Statistics

1. GET /api/statistics/dashboard (verifyToken + admin)

## 5. Request Validation Summary

### 5.1 Auth

POST /api/auth/register

```json
{
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "123456"
}
```

POST /api/auth/login

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

### 5.2 Cinema

POST /api/cinemas

```json
{
  "name": "GZA Bitexco",
  "address": "District 1, HCMC"
}
```

PUT /api/cinemas/:id

```json
{
  "name": "GZA Landmark",
  "address": "Binh Thanh, HCMC"
}
```

### 5.3 Movie

POST /api/movies (multipart/form-data)

Fields:
- title (required)
- genre (optional)
- description (required)
- duration_minutes (required, integer >= 1)
- release_date (required, YYYY-MM-DD)
- trailer_url (optional, URI)
- thumbnail (optional file)

Nếu không upload thumbnail, server gán ảnh default.

### 5.4 Room

POST /api/rooms/:cinemaId

```json
{
  "name": "Room 1",
  "cinema_id": 1,
  "rowCount": 5,
  "colCount": 10
}
```

Lưu ý:
- cinemaId lấy từ URL param
- validation hiện tại vẫn yêu cầu cinema_id trong body
- rowCount/colCount nếu bỏ qua thì default 5x10

PUT /api/rooms/:roomId/seats/:seatId

```json
{
  "status": "maintenance"
}
```

status hợp lệ: available | broken | maintenance

### 5.5 Showtime

POST /api/showtimes

```json
{
  "movie_id": "uuid",
  "room_id": "uuid",
  "start_time": "2026-03-28T19:00:00.000Z",
  "base_price": 90000
}
```

Server tự động tính end_time = start_time + movie.duration_minutes + 15 phút.
Server reject nếu bị trùng lịch trong cùng room.

### 5.6 Booking

POST /api/bookings/hold

```json
{
  "showtimeId": "uuid",
  "seatId": "uuid"
}
```

POST /api/bookings/unhold

```json
{
  "showtimeId": "uuid",
  "seatId": "uuid"
}
```

POST /api/payments/create-payment-url

```json
{
  "showtimeId": "uuid",
  "seatIds": ["uuid-1", "uuid-2"]
}
```

## 6. Query Params

GET /api/users/history?page=1&limit=10
- page default 1
- limit default 10

GET /api/movies?status=all&page=1&limit=10
- status: all | showing | coming_soon
- page default 1
- limit default 10

GET /api/showtimes?page=1&limit=10&movie_id=<uuid>
- page default 1
- limit default 10
- movie_id optional

GET /api/bookings?page=1&limit=10&status=pending
- page default 1
- limit default 10
- status optional

GET /api/statistics/dashboard?startDate=2026-01-01&endDate=2026-12-31&cinemaId=<uuid>
- startDate optional
- endDate optional
- cinemaId optional

## 7. Response Patterns

Success mẫu:

```json
{
  "status": "success",
  "message": "...",
  "data": {}
}
```

Error mẫu:

```json
{
  "status": "error",
  "message": "..."
}
```

Hoặc:

```json
{
  "status": "fail",
  "message": "..."
}
```

## 8. Important Business Behavior

### 8.1 Hold Seat và TTL

- Redis key: hold_seat:{showtimeId}:{seatId}
- Hold mặc định: 300 giây (5 phút)
- Nếu user hold lại chính ghế của mình, server gia hạn TTL
- Nếu ghế đã hold bởi user khác, server trả lỗi this seat is no longer available

### 8.2 Pricing Rule

- standard: base_price
- vip: base_price + 20000
- sweetbox: base_price + 50000

### 8.3 Room Auto Generate Seats

- default 5 hàng x 10 cột nếu không gửi rowCount/colCount
- hàng cuối cùng: sweetbox
- 2 hàng trước hàng cuối: vip
- các hàng còn lại: standard

### 8.4 Payment Flow

- create-payment-url tạo booking status pending + tickets status valid
- hold seat được extend lên 15 phút trong luồng payment
- vnpay_ipn verify chữ ký HMAC SHA512
- thành công: booking paid, xóa holds, emit realtime booked
- thất bại: booking cancelled, ticket refunded, xóa holds

### 8.5 Cron Cleanup

- cron chạy mỗi phút
- booking pending > 15 phút sẽ bị đổi sang cancelled

### 8.6 Realtime Events

Socket client events:
- join_showtime(showtimeId)
- leave_showtime(showtimeId)

Server emit:
- seat_status_changed

Payload mẫu:

```json
{
  "id": "seat-uuid",
  "status": "held"
}
```

## 9. Seat Map Response

GET /api/bookings/showtime/:showtimeId/seats

status trong danh sách seats:
- available
- held
- held_by_me
- booked

Mẫu rút gọn:

```json
{
  "status": "success",
  "data": {
    "showtime_info": {
      "movie_id": "uuid",
      "start_time": "2026-03-28T19:00:00.000Z",
      "room_name": "Room 1",
      "base_price": 90000
    },
    "seats": [
      {
        "id": "uuid",
        "row_letter": "A",
        "seat_number": 1,
        "type": "standard",
        "status": "available"
      }
    ]
  }
}
```

## 10. Notes for Frontend

- showtime admin APIs cần token + admin
- room seat update cho staff/admin
- logout endpoint hiện tại là public route
- refresh endpoint đọc refresh token từ cookie
- CORS đang cho phép origin = FRONTEND_URL và credentials = true
