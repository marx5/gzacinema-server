# Tai Lieu API Backend Cho Frontend (Ban Tieng Viet)

Tai lieu nay duoc cap nhat tu source code hien tai trong thu muc src vao ngay 2026-03-25.

## 1. Tong Quan

- Base path: /api
- Welcome endpoint: GET /api
- Response mau:
  - Thanh cong: status = success
  - Loi: status = error
- Dinh danh du lieu: UUID

Middleware toan cuc:
- helmet
- cors voi origin = process.env.FRONTEND_URL, credentials = true
- cookieParser
- express.json
- express.urlencoded extended true

## 2. Xac Thuc Va Phan Quyen

Access token:
- Gui trong header Authorization: Bearer <token>

Refresh token:
- Luu trong HttpOnly cookie ten refreshToken
- Lay access token moi qua POST /api/auth/refresh

Role:
- user: dat ve
- staff: check-in ve
- admin: tao cinema, movie, room, showtime

Auth middleware:
- verifyToken
  - 401: You are not authenticated or your token is missing
  - 401: Invalid or expired token
- verifyAdmin
  - 403: You do not have permission to perform this action
- verifyStaff
  - 403: You do not have permission to perform this action

## 3. Danh Sach Endpoint Dang Hoat Dong

1. GET /api
2. POST /api/auth/register
3. POST /api/auth/login
4. POST /api/auth/logout
5. POST /api/auth/refresh
6. GET /api/users/me
7. GET /api/users/history
8. POST /api/cinemas
9. GET /api/cinemas
10. GET /api/cinemas/:id
11. PUT /api/cinemas/:id
12. DELETE /api/cinemas/:id
13. POST /api/movies
14. GET /api/movies
15. GET /api/movies/:id
16. GET /api/movies/:movieId/showtimes
17. PUT /api/movies/:id
18. DELETE /api/movies/:id
19. POST /api/rooms/:cinemaId
20. GET /api/rooms/cinema/:cinemaId
21. PUT /api/rooms/:roomId
22. DELETE /api/rooms/:roomId
23. POST /api/showtimes
24. GET /api/bookings/showtime/:showtimeId/seats
25. POST /api/bookings/hold
26. POST /api/bookings/unhold
27. POST /api/payments/create-payment-url
28. GET /api/payments/vnpay_ipn
29. PUT /api/tickets/:id/checkin
30. GET /api/statistics/dashboard

Luu y:
- Khong co endpoint POST /api/bookings/checkout trong route hien tai.

## 4. Chi Tiet Tung Nhom API

## 4.1 Auth

### POST /api/auth/register

Auth: Khong

Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Success 201:

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

Error:
- 400: Email already in use

### POST /api/auth/login

Auth: Khong

Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Success 200:
- Set-Cookie: refreshToken (HttpOnly, sameSite strict, 7 ngay)

```json
{
  "status": "success",
  "message": "Login successful",
  "accessToken": "jwt-access-token",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

Error:
- 401: Invalid email or password

### POST /api/auth/logout

Auth: Khong

Success 200:

```json
{
  "status": "success",
  "message": "Logout successful"
}
```

### POST /api/auth/refresh

Auth: Cookie refreshToken (khong can bearer token)

Success 200:

```json
{
  "status": "success",
  "accessToken": "new-jwt-access-token"
}
```

Error:
- 401: Refresh token is missing
- 401: Invalid or expired refresh token

## 4.2 User

### GET /api/users/me

Auth: Bearer token

Success 200:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:00:00.000Z"
  }
}
```

Error:
- 404: User not found
- 500: Loi he thong

### GET /api/users/history

Auth: Bearer token

Mo ta:
- Tra ve danh sach booking da thanh toan cua user dang dang nhap.
- Sap xep moi nhat truoc (createdAt DESC).

Success 200 mau:

```json
{
  "status": "success",
  "data": [
    {
      "id": "booking-uuid",
      "total_amount": "190000.00",
      "status": "paid",
      "showtime": {
        "start_time": "2026-03-24T09:00:00.000Z",
        "movie": {
          "title": "Dune",
          "duration_minutes": 155
        },
        "room": {
          "name": "Room 1"
        }
      },
      "tickets": [
        {
          "id": "ticket-uuid",
          "price": "90000.00",
          "status": "valid",
          "seat": {
            "row_letter": "A",
            "seat_number": 1,
            "type": "vip"
          }
        }
      ]
    }
  ]
}
```

Error:
- 500: Loi he thong

## 4.3 Cinema

### POST /api/cinemas

Auth: Bearer token + role admin

Body:

```json
{
  "name": "CGV District 1",
  "address": "123 Main St"
}
```

Success 201:

```json
{
  "status": "success",
  "message": "Cinema created successfully",
  "data": {
    "id": "uuid",
    "name": "CGV District 1",
    "address": "123 Main St",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Error:
- 403: Khong du quyen
- 500: Loi he thong

### GET /api/cinemas

Auth: Khong

Success 200:
- Tra ve danh sach rap.

### GET /api/cinemas/:id

Auth: Khong

Success 200:
- Tra ve thong tin chi tiet 1 rap.

Error:
- 404: Cinema not found

### PUT /api/cinemas/:id

Auth: Bearer token + role admin

Body:
- Co the cap nhat name va/hoac address.

Error:
- 403: Khong du quyen
- 404: Cinema not found

### DELETE /api/cinemas/:id

Auth: Bearer token + role admin

Success 200:
- message: Cinema deleted successfully

Error:
- 403: Khong du quyen
- 404: Cinema not found

## 4.4 Movie

### POST /api/movies

Auth: Bearer token + role admin

Body:

```json
{
  "title": "Dune: Part Two",
  "description": "Epic sci-fi thriller",
  "duration_minutes": 155,
  "release_date": "2026-03-24"
}
```

Success 201:

```json
{
  "status": "success",
  "message": "Movie created successfully",
  "data": {
    "id": "uuid",
    "title": "Dune: Part Two",
    "description": "Epic sci-fi thriller",
    "duration_minutes": 155,
    "release_date": "2026-03-24"
  }
}
```

Error:
- 400: Du lieu khong hop le
- 403: Khong du quyen

### GET /api/movies

Auth: Khong

Query optional:
- status=showing
- status=coming_soon

Mo ta:
- Neu khong truyen status: tra ve tat ca phim
- showing: release_date <= hom nay
- coming_soon: release_date > hom nay

Success 200:

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "title": "Dune",
      "description": "...",
      "duration_minutes": 155,
      "release_date": "2026-03-20"
    }
  ]
}
```

Error:
- 500: Loi he thong

### GET /api/movies/:id

Auth: Khong

Success 200:

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Dune",
    "description": "...",
    "duration_minutes": 155,
    "release_date": "2026-03-20"
  }
}
```

Error:
- 404: Movie not found

### GET /api/movies/:movieId/showtimes

Auth: Khong

Mo ta:
- Tra ve danh sach suat chieu sap toi cua phim, group theo rap.

Success 200:

```json
{
  "status": "success",
  "data": [
    {
      "cinema_info": {
        "id": "cinema-uuid",
        "name": "CGV District 1",
        "address": "123 Main St"
      },
      "showtimes": [
        {
          "showtime_id": "showtime-uuid",
          "room_name": "Room 1",
          "start_time": "2026-03-24T09:00:00.000Z",
          "base_price": "70000.00"
        }
      ]
    }
  ]
}
```

Error:
- 400: Loi truy van he thong

### PUT /api/movies/:id

Auth: Bearer token + role admin

Body:
- Cac field phim can cap nhat (title, description, duration_minutes, release_date, thumbnail).

Error:
- 403: Khong du quyen
- 404: Movie not found

### DELETE /api/movies/:id

Auth: Bearer token + role admin

Success 200:
- message: Movie deleted successfully

Error:
- 403: Khong du quyen
- 404: Movie not found

## 4.5 Room

### POST /api/rooms/:cinemaId

Auth: Bearer token + role admin

Body:

```json
{
  "name": "Room 1",
  "rowCount": 5,
  "colCount": 10
}
```

Gia tri mac dinh:
- rowCount = 5
- colCount = 10

Quy tac loai ghe khi tao tu dong:
- Hang cuoi: sweetbox
- 2 hang truoc hang cuoi: vip
- Con lai: standard

Success 201:

```json
{
  "status": "success",
  "message": "Room created successfully",
  "data": {
    "id": "uuid",
    "name": "Room 1",
    "cinema_id": "cinema-uuid",
    "total_seats_generated": 50
  }
}
```

Error:
- 400: Cinema not found
- 403: Khong du quyen

### GET /api/rooms/cinema/:cinemaId

Auth: Bearer token

Success 200:
- Tra ve danh sach phong theo rap.

### PUT /api/rooms/:roomId

Auth: Bearer token + role admin

Body:
- Co the cap nhat name, rowCount, colCount.

Error:
- 403: Khong du quyen
- 400: Room not found

### DELETE /api/rooms/:roomId

Auth: Bearer token + role admin

Success 200:
- message: Room deleted successfully

Error:
- 403: Khong du quyen
- 400: Room not found

## 4.6 Showtime

### POST /api/showtimes

Auth: Bearer token + role admin

Body:

```json
{
  "movie_id": "movie-uuid",
  "room_id": "room-uuid",
  "start_time": "2026-03-24T09:00:00.000Z",
  "base_price": 70000
}
```

Business rule:
- end_time = start_time + duration_minutes cua movie + 15 phut
- Khong cho phep trung lich trong cung room

Success 201:

```json
{
  "status": "success",
  "message": "Showtime created successfully",
  "data": {
    "id": "uuid",
    "movie_id": "movie-uuid",
    "room_id": "room-uuid",
    "start_time": "...",
    "end_time": "...",
    "base_price": "70000.00"
  }
}
```

Error:
- 400: Movie not found
- 400: Room not found
- 400: Showtime overlaps with an existing showtime in the same room
- 403: Khong du quyen

## 4.7 Booking

### GET /api/bookings/showtime/:showtimeId/seats

Auth: Bearer token

Success 200:

```json
{
  "status": "success",
  "data": {
    "showtime_info": {
      "movie_id": "movie-uuid",
      "start_time": "2026-03-24T09:00:00.000Z",
      "room_name": "Room 1"
    },
    "seats": [
      {
        "id": "seat-uuid",
        "row_letter": "A",
        "seat_number": 1,
        "type": "standard",
        "status": "available"
      }
    ]
  }
}
```

Y nghia status tra ve cho frontend:
- available: ghe trong
- held: dang duoc giu boi mot user
- booked: da thanh toan

Error:
- 400: Showtime not found

### POST /api/bookings/hold

Auth: Bearer token

Body:

```json
{
  "showtimeId": "showtime-uuid",
  "seatId": "seat-uuid"
}
```

Success 200:

```json
{
  "status": "success",
  "data": {
    "message": "Seat held successfully, hold will expire in 5 minutes",
    "showtime_id": "showtime-uuid",
    "seat_id": "seat-uuid",
    "expire_time": 300
  }
}
```

Error:
- 400: showtimeId and seatId are required
- 400: Showtime not found
- 400: Seat not found
- 400: Seat already sold
- 400: You have already held this seat
- 400: Seat is currently held by another user

### POST /api/bookings/unhold

Auth: Bearer token

Body:

```json
{
  "showtimeId": "showtime-uuid",
  "seatId": "seat-uuid"
}
```

Success 200:
- message: Seat released successfully

Error:
- 400: Showtime not found
- 400: Seat not found
- 400: You can only unhold your own held seat

## 4.8 Payment

### POST /api/payments/create-payment-url

Auth: Bearer token

Body:

```json
{
  "showtimeId": "showtime-uuid",
  "seatIds": ["seat-1", "seat-2"]
}
```

Luong xu ly:
1. Kiem tra user dang hold tat ca seatIds
2. Tinh tong tien theo loai ghe
3. Tao booking voi status pending
4. Tao ticket voi status valid
5. Gia han hold Redis len 15 phut
6. Tao VNPay paymentUrl va tra ve frontend

Cong gia theo loai ghe:
- standard: +0
- vip: +20000
- sweetbox: +50000

Success 200:

```json
{
  "status": "success",
  "message": "Payment URL created successfully",
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/...",
    "bookingId": "booking-uuid"
  }
}
```

Error:
- 400: Invalid data provided
- 400: showtime not found
- 400: Seat <id> is not held by you or the hold has expired. Please hold the seat again before checkout.
- 400: Payment initialization failed: ...

### GET /api/payments/vnpay_ipn

Auth: Khong (callback tu VNPay)

Response format rieng:

```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

RspCode co the gap:
- 00: Thanh cong hoac that bai da duoc xu ly (confirm/cancel)
- 01: Order not found
- 02: Order already confirmed
- 97: Checksum failed
- 99: Unknown error

## 4.9 Ticket

### PUT /api/tickets/:id/checkin

Auth: Bearer token + role staff hoac admin

Success 200:

```json
{
  "status": "success",
  "message": "Ticket checked in successfully",
  "data": {
    "id": "ticket-uuid",
    "booking_id": "booking-uuid",
    "seat_id": "seat-uuid",
    "price": "90000.00",
    "status": "used"
  }
}
```

Error:
- 400: Ticket not found
- 400: Ticket has already been used
- 400: Ticket has already been refunded
- 403: Khong du quyen

## 4.10 Statistic

### GET /api/statistics/dashboard

Auth: Bearer token + role admin

Query optional:
- startDate (YYYY-MM-DD)
- endDate (YYYY-MM-DD)
- cinemaId

Success 200:
- Tra ve dashboard thong ke (doanh thu, so ve, suat chieu, user moi...) theo bo loc.

Error:
- 403: Khong du quyen
- 500: Loi he thong

## 5. Luong Tich Hop De Xuat Cho Frontend

Luong dat ve va thanh toan:
1. Goi GET /api/movies hoac GET /api/movies/:movieId/showtimes de hien thi lich phim
2. Goi GET /api/bookings/showtime/:showtimeId/seats de lay so do ghe
3. Goi POST /api/bookings/hold cho tung ghe nguoi dung chon
4. Goi POST /api/payments/create-payment-url
5. Redirect den paymentUrl
6. Sau khi thanh toan xong, reload lich su qua GET /api/users/history

Luong refresh token:
1. Khi API tra 401 token het han, goi POST /api/auth/refresh
2. Lay access token moi
3. Retry request cu

## 6. Field Model Can Frontend Quan Tam

User:
- id, email, role, createdAt, updatedAt

Cinema:
- id, name, address, createdAt, updatedAt

Movie:
- id, title, description, duration_minutes, release_date, createdAt, updatedAt

Room:
- id, name, cinema_id, createdAt, updatedAt

Seat:
- id, room_id, row_letter, seat_number, type, status, createdAt, updatedAt, deletedAt

Showtime:
- id, movie_id, room_id, start_time, end_time, base_price, createdAt, updatedAt

Booking:
- id, user_id, showtime_id, total_amount, status (pending|paid|cancelled), createdAt, updatedAt

Ticket:
- id, booking_id, seat_id, price, status (valid|used|refunded), createdAt, updatedAt