# Gzacinema Backend API Docs (Frontend)

Tài liệu này được cập nhật đồng bộ 100% với source code hiện tại của `gzacinema-server`.
Tất cả các API nghiệp vụ đều có base path: `/api` (ngoài ra server hỗ trợ `/` và `/health` cho mục đích health check).

## 1. Quy ước chung (General)

- **Success response**: luôn có trường `"status": "success"`
- **Error response**: có trường `"status": "fail"` (lỗi 4xx) hoặc `"status": "error"` (lỗi 5xx / rate limit)
- **Access Token**: gửi qua HTTP Header:

```http
Authorization: Bearer <access_token>
```

- **Refresh Token**: được server tự động gắn vào cookie `refreshToken` (`httpOnly: true`, `sameSite: 'strict'` trên production hoặc `'lax'` ở development) khi đăng nhập.

## 2. Auth Middleware và Phân quyền (Roles)

- `verifyToken`: yêu cầu Access Token hợp lệ.
- `verifyStaff`: yêu cầu role `staff` hoặc `admin`.
- `verifyAdmin`: chỉ cho phép role `admin`.

Phân quyền theo vai trò:
- `user`: đặt vé, giữ/bỏ giữ ghế, thanh toán VNPay, xem/cập nhật hồ sơ cá nhân, xem lịch sử đặt vé.
- `staff`: xem danh sách phòng chiếu theo rạp, cập nhật trạng thái vật lý của ghế (`available`, `broken`, `maintenance`), soát vé (`check-in`).
- `admin`: toàn quyền quản trị hệ thống (`cinema`, `movie`, `room`, `showtime`, `booking`, `statistic`) và bao gồm mọi quyền của `staff`.

## 3. Giới hạn tần suất (Rate Limit)

- **General limiter**: `5000` requests / 15 phút / IP.
- **Auth routes (`/register`, `/login`)**: `20` requests / 15 phút / IP.
- **Booking routes (`/api/bookings/*`)**: `50` requests lỗi / 15 phút / IP (`skipSuccessfulRequests: true`).
- **Payment routes (`/api/payments/*`)**: `30` requests lỗi / 15 phút / IP (`skipSuccessfulRequests: true`).

## 4. Danh sách Endpoint (Endpoint List)

### 4.1 System / Health Check

1. `GET /`
2. `GET /health`
3. `GET /api`

### 4.2 Auth

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/logout`
4. `POST /api/auth/refresh`

### 4.3 Users (`verifyToken`)

1. `GET /api/users/profile` (bí danh: `GET /api/users/me`)
2. `PUT /api/users/profile` (bí danh: `PUT /api/users/me`)
3. `GET /api/users/history`

### 4.4 Cinemas

1. `POST /api/cinemas` (`verifyToken` + `verifyAdmin`)
2. `GET /api/cinemas` (public)
3. `GET /api/cinemas/:id` (public)
4. `PUT /api/cinemas/:id` (`verifyToken` + `verifyAdmin`)
5. `DELETE /api/cinemas/:id` (`verifyToken` + `verifyAdmin`)

### 4.5 Movies

1. `POST /api/movies` (`verifyToken` + `verifyAdmin`, `multipart/form-data`)
2. `GET /api/movies` (public)
3. `GET /api/movies/ranking` (public)
4. `GET /api/movies/:id` (public)
5. `GET /api/movies/:movieId/showtimes` (public)
6. `PUT /api/movies/:id` (`verifyToken` + `verifyAdmin`, `multipart/form-data`)
7. `DELETE /api/movies/:id` (`verifyToken` + `verifyAdmin`)

### 4.6 Rooms (mount dưới `/api/cinemas`)

1. `POST /api/cinemas/:cinemaId/rooms` (`verifyToken` + `verifyAdmin`)
2. `GET /api/cinemas/:cinemaId/rooms` (`verifyToken` + `verifyStaff`)
3. `PUT /api/cinemas/:cinemaId/rooms/:roomId` (`verifyToken` + `verifyAdmin`)
4. `DELETE /api/cinemas/:cinemaId/rooms/:roomId` (`verifyToken` + `verifyAdmin`)
5. `PUT /api/cinemas/:cinemaId/rooms/:roomId/seats/:seatId` (`verifyToken` + `verifyStaff`)

### 4.7 Showtimes (`verifyToken` + `verifyAdmin`)

1. `POST /api/showtimes`
2. `GET /api/showtimes`
3. `DELETE /api/showtimes/:id`

### 4.8 Bookings (`verifyToken`)

1. `GET /api/bookings/showtime/:showtimeId/seats`
2. `POST /api/bookings/hold`
3. `POST /api/bookings/unhold`
4. `GET /api/bookings` (`verifyToken` + `verifyAdmin`)

### 4.9 Payments

1. `POST /api/payments/create-payment-url` (`verifyToken`)
2. `GET /api/payments/vnpay_ipn` (public callback từ VNPay)

### 4.10 Tickets

1. `PUT /api/tickets/:id/checkin` (`verifyToken` + `verifyStaff`)

### 4.11 Statistics

1. `GET /api/statistics/dashboard` (`verifyToken` + `verifyAdmin`)

---

## 5. Chi tiết Request Body & Validation

### 5.1 Auth

`POST /api/auth/register`

```json
{
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "123456"
}
```

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

### 5.2 User Profile

`PUT /api/users/profile` (hoặc `PUT /api/users/me`)

```json
{
  "full_name": "Nguyen Van B",
  "phone_number": "0901234567",
  "old_password": "123456",
  "new_password": "654321"
}
```

Lưu ý:
- Yêu cầu tối thiểu 1 trường trong body.
- Nếu gửi `new_password` thì bắt buộc phải gửi kèm `old_password`.

### 5.3 Cinema

`POST /api/cinemas`

```json
{
  "name": "GZA Bitexco",
  "address": "District 1, HCMC"
}
```

`PUT /api/cinemas/:id`

```json
{
  "name": "GZA Landmark",
  "address": "Binh Thanh, HCMC"
}
```

### 5.4 Movie

`POST /api/movies` và `PUT /api/movies/:id` (`multipart/form-data`)

Fields:
- `title` (required khi tạo mới, string)
- `genre` (optional, string)
- `description` (required khi tạo mới, string)
- `duration_minutes` (required khi tạo mới, integer >= 1)
- `release_date` (required khi tạo mới, định dạng `YYYY-MM-DD`)
- `trailer_url` (optional, URI hợp lệ)
- `thumbnail` (optional file ảnh: JPEG, PNG, WEBP, GIF, tối đa 10MB)

Nếu không upload `thumbnail` khi tạo mới, server tự động gán ảnh mặc định.

### 5.5 Room & Seat Status

`POST /api/cinemas/:cinemaId/rooms`

```json
{
  "name": "Room 1",
  "rowCount": 5,
  "colCount": 10
}
```

Lưu ý:
- `cinemaId` truyền qua URL param `:cinemaId` (không cần truyền `cinema_id` trong body).
- `rowCount` (1 - 26, mặc định `5`) và `colCount` (1 - 30, mặc định `10`) là tùy chọn.

`PUT /api/cinemas/:cinemaId/rooms/:roomId`

```json
{
  "name": "Room IMAX 1"
}
```

`PUT /api/cinemas/:cinemaId/rooms/:roomId/seats/:seatId`

```json
{
  "status": "maintenance"
}
```

`status` hợp lệ: `"available"` | `"broken"` | `"maintenance"`.

### 5.6 Showtime

`POST /api/showtimes`

```json
{
  "movie_id": "uuid",
  "room_id": "uuid",
  "start_time": "2026-03-28T19:00:00.000Z",
  "base_price": 90000
}
```

- Server tự động tính `end_time = start_time + movie.duration_minutes + 15 phút`.
- Server từ chối nếu khoảng thời gian `[start_time, end_time]` bị chồng lấn với bất kỳ suất chiếu nào khác trong cùng `room_id`.

### 5.7 Booking & Payment

`POST /api/bookings/hold`

Hỗ trợ gửi mảng `seatIds` (khuyến nghị) hoặc 1 ghế đơn `seatId`:

```json
{
  "showtimeId": "uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

Hoặc:

```json
{
  "showtimeId": "uuid",
  "seatId": "seat-uuid-1"
}
```

`POST /api/bookings/unhold`

Hỗ trợ gửi mảng `seatIds` hoặc 1 ghế đơn `seatId`:

```json
{
  "showtimeId": "uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

`POST /api/payments/create-payment-url`

```json
{
  "showtimeId": "uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

---

## 6. Query Params & Phân trang

Tất cả các API phân trang đều chuẩn hóa `page` (mặc định `1`, tối thiểu `1`) và `limit` (mặc định `10`, tối đa `100`):

- `GET /api/users/history?page=1&limit=10`
  - Trả về: `{ total_items, total_pages, current_page, history: [...] }`
- `GET /api/movies?status=all&page=1&limit=10`
  - `status`: `all` | `showing` | `coming_soon` (so sánh `release_date` theo múi giờ `Asia/Ho_Chi_Minh`)
  - Trả về: `{ total_items, total_pages, current_page, movie: [...] }`
- `GET /api/movies/ranking?limit=10`
  - `limit`: mặc định `10`, tối đa `100`
  - Trả về: danh sách phim kèm `rank`, `total_tickets`, `total_revenue`, `first_revenue_time`
- `GET /api/showtimes?page=1&limit=10&movie_id=<uuid>`
  - `movie_id`: optional
  - Trả về: `{ total_items, total_pages, current_page, showtimes: [...] }`
- `GET /api/bookings?page=1&limit=10&status=pending`
  - `status`: optional (`pending` | `paid` | `cancelled`)
  - Trả về: `{ total_items, total_pages, current_page, bookings: [...] }`
- `GET /api/statistics/dashboard?startDate=2026-01-01&endDate=2026-12-31&cinemaId=<uuid>`
  - `startDate`, `endDate`, `cinemaId`: optional

---

## 7. Cấu trúc Response Mẫu (Response Patterns)

Success mẫu:

```json
{
  "status": "success",
  "message": "...",
  "data": {}
}
```

Error mẫu (4xx):

```json
{
  "status": "fail",
  "message": "..."
}
```

Error mẫu (5xx):

```json
{
  "status": "error",
  "message": "..."
}
```

---

## 8. Quy tắc nghiệp vụ quan trọng (Important Business Behavior)

### 8.1 Quy tắc chọn ghế, Giữ ghế và TTL

- Redis key: `hold_seat:{showtimeId}:{seatId}`
- **TTL giữ ghế mặc định**: `300` giây (5 phút).
- **Quy tắc chọn ghế**:
  - Tất cả ghế chọn trong cùng một lần đặt phải **cùng loại** (`standard`, `vip` hoặc `sweetbox`).
  - Các ghế được chọn (bao gồm cả ghế đang được giữ bởi chính user đó) phải **liền kề nhau theo 4 hướng** (trên, dưới, trái, phải) tạo thành một cụm liên thông duy nhất.
  - Khi bỏ giữ ghế (`unhold`), không được phép bỏ chọn ghế nằm ở giữa làm tách rời các ghế còn lại đang chọn.
  - Không thể giữ ghế đang ở trạng thái vật lý `broken` hoặc `maintenance`.
- Nếu user gọi `hold` lại trên ghế mà chính mình đang giữ, hệ thống sẽ gia hạn lại TTL 5 phút.

### 8.2 Quy tắc tính giá vé (Pricing Rule)

- `standard`: `base_price`
- `vip`: `base_price + 20000`
- `sweetbox`: `base_price + 50000`

### 8.3 Tự động sinh ghế khi tạo phòng (Room Auto Generate Seats)

- Mặc định `5` hàng x `10` cột nếu không truyền `rowCount` / `colCount`.
- Hàng cuối cùng (`rowCount - 1`): `sweetbox`.
- 2 hàng liền trước hàng cuối (`rowCount - 3` và `rowCount - 2`): `vip`.
- Các hàng còn lại: `standard`.

### 8.4 Luồng thanh toán VNPay (Payment Flow)

- `POST /api/payments/create-payment-url`:
  - Kiểm tra toàn bộ ghế có đang được giữ bởi chính `userId` trong Redis không và **gia hạn nguyên tử TTL lên 17 phút** (`1020` giây).
  - Tự động hủy các đơn `pending` cũ của cùng `userId` trong cùng `showtimeId` (nếu có) trước khi tạo `Booking` mới (`status: 'pending'`) và các `Ticket` (`status: 'valid'`).
- `GET /api/payments/vnpay_ipn`:
  - Xác thực chữ ký `HMAC-SHA512` và đối chiếu số tiền thanh toán.
  - Nếu thành công (`vnp_ResponseCode === '00'` và `vnp_TransactionStatus === '00'`): khóa bi quan (`FOR UPDATE`) trên `Booking` & `Seat` để chống double-booking, chuyển `Booking` sang `paid`, xóa hold keys trên Redis và phát sự kiện realtime `booked`.
  - Nếu thất bại: chuyển `Booking` sang `cancelled`, `Ticket` sang `refunded`, xóa hold keys của user trên Redis và phát sự kiện realtime `available`.

### 8.5 Tiến trình dọn dẹp tự động (Cron Cleanup)

- Cron job chạy định kỳ mỗi phút (`0 * * * * *`).
- Các đơn hàng `pending` tạo quá **15 phút** sẽ được chuyển sang `cancelled`, vé chuyển sang `refunded`, đồng thời giải phóng khóa Redis và phát sự kiện realtime `available` cho các ghế tương ứng.

### 8.6 Sự kiện Realtime (Socket.IO Events)

Sự kiện từ Client gửi lên Server:
- `join_showtime(showtimeId)`
- `leave_showtime(showtimeId)`

Sự kiện từ Server phát về Client trong room `showtimeId`:
- `seat_status_changed`

Payload mẫu:

```json
{
  "id": "seat-uuid",
  "status": "held"
}
```

Giá trị `status` trong sự kiện `seat_status_changed`: `"available"` | `"held"` | `"booked"`.

---

## 9. Sơ đồ ghế (Seat Map Response)

`GET /api/bookings/showtime/:showtimeId/seats`

Trường `status` của từng ghế trong danh sách `seats` có thể nhận một trong các giá trị:
- `available`: Ghế trống, có thể chọn.
- `held`: Đang được người dùng khác tạm giữ.
- `held_by_me`: Đang được chính người dùng hiện tại tạm giữ.
- `booked`: Đã bán thành công.
- `broken`: Ghế hỏng (không thể đặt).
- `maintenance`: Ghế đang bảo trì (không thể đặt).

Response mẫu:

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
