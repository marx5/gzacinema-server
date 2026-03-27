# Gzacinema Backend API Docs (Frontend)

Tai lieu nay duoc cap nhat theo source code hien tai.
Tat ca endpoint deu co base path: `/api`.

## 1. General

- Success response thuong co `status: success`
- Error response thuong co `status: error` hoac `status: fail`
- Access token gui qua header:

```http
Authorization: Bearer <access_token>
```

- Refresh token duoc server set trong cookie `refreshToken` khi login

## 2. Authentication and Roles

- `verifyToken`: yeu cau access token hop le
- `verifyAdmin`: yeu cau role `admin`
- `verifyStaff`: yeu cau role `staff`

Role mapping:

- `user`: dat ve, xem lich su, cap nhat profile
- `staff`: check-in ve, cap nhat trang thai ghe
- `admin`: quan tri cinema/movie/room/showtime, xem booking va statistic

## 3. Endpoint List

### 3.1 System

1. `GET /api`

### 3.2 Auth

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/logout`
4. `POST /api/auth/refresh`

### 3.3 Users

1. `GET /api/users/me`
2. `PUT /api/users/me`
3. `GET /api/users/history`

### 3.4 Cinemas

1. `POST /api/cinemas` (admin)
2. `GET /api/cinemas`
3. `GET /api/cinemas/:id`
4. `PUT /api/cinemas/:id` (admin)
5. `DELETE /api/cinemas/:id` (admin)

### 3.5 Movies

1. `POST /api/movies` (admin, multipart/form-data)
2. `GET /api/movies`
3. `GET /api/movies/:id`
4. `GET /api/movies/:movieId/showtimes`
5. `PUT /api/movies/:id` (admin)
6. `DELETE /api/movies/:id` (admin)

### 3.6 Rooms

1. `POST /api/rooms/:cinemaId` (admin)
2. `GET /api/rooms/cinema/:cinemaId` (auth)
3. `PUT /api/rooms/:roomId` (admin)
4. `DELETE /api/rooms/:roomId` (admin)
5. `PUT /api/rooms/:roomId/seats/:seatId` (staff)

### 3.7 Showtimes

1. `POST /api/showtimes` (admin)
2. `GET /api/showtimes` (admin)
3. `DELETE /api/showtimes/:id` (admin)

### 3.8 Bookings

1. `GET /api/bookings/showtime/:showtimeId/seats` (auth)
2. `POST /api/bookings/hold` (auth)
3. `POST /api/bookings/unhold` (auth)
4. `GET /api/bookings` (admin)

### 3.9 Payments

1. `POST /api/payments/create-payment-url` (auth)
2. `GET /api/payments/vnpay_ipn`

### 3.10 Tickets

1. `PUT /api/tickets/:id/checkin` (staff)

### 3.11 Statistics

1. `GET /api/statistics/dashboard` (admin)

## 4. Request Samples

### 4.1 Register

`POST /api/auth/register`

```json
{
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "123456"
}
```

### 4.2 Login

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Success response (rut gon):

```json
{
  "status": "success",
  "message": "Login successful",
  "accessToken": "<jwt>",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 4.3 Update Profile

`PUT /api/users/me` (auth)

```json
{
  "full_name": "Nguyen Van B",
  "phone_number": "0909123456",
  "old_password": "123456",
  "new_password": "654321"
}
```

Ghi chu:
- Co the gui 1 phan data de cap nhat
- Neu doi mat khau thi can ca `old_password` va `new_password`

### 4.4 Create Movie

`POST /api/movies` (admin)

Content type: `multipart/form-data`

Form fields:
- `title` (required)
- `genre` (optional)
- `description` (required)
- `duration_minutes` (required)
- `release_date` (required, ISO date)
- `trailer_url` (optional)
- `thumbnail` (optional file)

Neu khong upload `thumbnail`, server se gan anh default.

### 4.5 Get Movies

`GET /api/movies?status=showing&page=1&limit=10`

Query:
- `status`: `all` (mac dinh) | `showing` | `coming_soon`
- `page`: mac dinh 1
- `limit`: mac dinh 10

### 4.6 Create Room

`POST /api/rooms/:cinemaId` (admin)

```json
{
  "name": "Room 1",
  "cinema_id": 1,
  "rowCount": 5,
  "colCount": 10
}
```

Ghi chu:
- `cinemaId` duoc lay tu URL param
- Validation hien tai van yeu cau `cinema_id` trong body
- Neu khong gui `rowCount`, `colCount`, server mac dinh 5x10

### 4.7 Create Showtime

`POST /api/showtimes` (admin)

```json
{
  "movie_id": "uuid",
  "room_id": "uuid",
  "start_time": "2026-03-28T19:00:00.000Z",
  "base_price": 90000
}
```

Server tu dong tinh `end_time = start_time + duration_minutes + 15`.

### 4.8 Get Seat Map

`GET /api/bookings/showtime/:showtimeId/seats` (auth)

Trang thai ghe trong response:
- `available`
- `booked`
- `held`
- `held_by_me`

### 4.9 Hold Seat

`POST /api/bookings/hold` (auth)

```json
{
  "showtimeId": "uuid",
  "seatId": "uuid"
}
```

Ghe duoc hold trong 5 phut.

### 4.10 Unhold Seat

`POST /api/bookings/unhold` (auth)

```json
{
  "showtimeId": "uuid",
  "seatId": "uuid"
}
```

### 4.11 Create Payment URL

`POST /api/payments/create-payment-url` (auth)

```json
{
  "showtimeId": "uuid",
  "seatIds": ["uuid-1", "uuid-2"]
}
```

Success response (rut gon):

```json
{
  "status": "success",
  "message": "Payment URL created successfully",
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/...",
    "bookingId": "uuid"
  }
}
```

Luu y quan trong:
- Tat ca seat trong `seatIds` phai dang duoc hold boi chinh user hien tai
- Booking duoc tao voi status `pending` truoc khi redirect sang VNPay
- VNPay IPN thanh cong -> booking `paid`
- VNPay IPN that bai -> booking `cancelled`, ticket `refunded`

### 4.12 Admin Booking List

`GET /api/bookings?page=1&limit=10&status=paid` (admin)

Query:
- `page` mac dinh 1
- `limit` mac dinh 10
- `status` (optional): `pending|paid|cancelled`

### 4.13 Admin Dashboard

`GET /api/statistics/dashboard?startDate=2026-03-01&endDate=2026-03-31` (admin)

Response data gom:
- `overview.total_revenue`
- `overview.total_users`
- `overview.total_tickets_sold`
- `revenue_by_movie[]`

## 5. Error Notes

Mot so loi thuong gap:
- 400: Du lieu khong hop le, sai body, seat da bi giu/da ban
- 401: Chua dang nhap, token sai/het han
- 403: Khong du quyen role
- 404: Khong tim thay resource
- 429: Qua gioi han request

## 6. Frontend Integration Checklist

- Luon gui `Authorization` voi endpoint yeu cau auth
- Bat `withCredentials: true` neu frontend can goi refresh flow bang cookie
- Sau login, luu access token va refresh token de trong cookie do backend quan ly
- Truoc khi thanh toan, bat buoc hold ghe
- Sau khi redirect thanh toan, frontend can co trang return tu `VNP_RETURN_URL`
