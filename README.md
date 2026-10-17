# Gzacinema Server

Backend API cho hệ thống đặt vé xem phim trực tuyến **Gzacinema**, được xây dựng trên nền tảng **Node.js**, **Express 5**, **Sequelize (MySQL)**, **Redis**, **Socket.IO**, **MinIO** và **VNPay**. Hệ thống được thiết kế theo hướng **Modular DDD / Clean Architecture**, đảm bảo tính nhất quán dữ liệu cao trong môi trường đồng thời (High Concurrency) khi giữ ghế và thanh toán.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Runtime & Framework**: Node.js (>= 18), Express 5
- **Cơ sở dữ liệu & ORM**: MySQL, Sequelize 6 (hỗ trợ Transaction & Pessimistic Row Locking)
- **In-Memory Cache & Distributed Lock**: Redis (`ioredis`) kết hợp **Atomic Lua Scripts** và **Redis Keyspace Notifications**
- **Realtime Communication**: Socket.IO 4 + Internal EventBus (`EventEmitter`)
- **Xác thực & Phân quyền**: JWT (`Access Token` + `HttpOnly Refresh Token Cookie`), `bcrypt`
- **Object Storage**: MinIO S3-compatible storage + `multer` (upload poster phim)
- **Payment Gateway**: VNPay (`HMAC-SHA512` checksum & IPN Webhook)
- **Background Jobs**: `node-cron` (tự động thu hồi đơn hàng `pending` quá hạn)
- **Bảo mật & Tiện ích**: `helmet`, `cors`, `express-rate-limit`, `compression`, `joi`, `morgan`

---

## 2. Kiến trúc hệ thống (Architecture Overview)

Hệ thống áp dụng kiến trúc phân tầng theo mô-đun (**Clean Architecture / Modular DDD**), tách biệt rõ ràng giữa giao diện HTTP/WebSocket, nghiệp vụ ứng dụng, quy tắc miền (Domain Rules) và hạ tầng kỹ thuật (Infrastructure):

- **Presentation / Interface Layer (`*.route.js`, `*.controller.js`, `*.validation.js`, `seatSocket.handler.js`)**:
  - Tiếp nhận HTTP Request, xác thực đầu vào qua schema `Joi`, kiểm tra quyền truy cập (`verifyToken`, `verifyStaff`, `verifyAdmin`).
  - `seatSocket.handler.js` đóng vai trò là **Interface Adapter** lắng nghe sự kiện từ `EventBus` nội bộ để phát thông báo realtime (`seat_status_changed`) tới các phòng chiếu (`showtimeId`) qua Socket.IO.
- **Application / Service Layer (`*.service.js`, `cleanup.js`)**:
  - Điều phối các ca sử dụng (Use Cases): giữ ghế, tạo giao dịch thanh toán, đối soát IPN VNPay, thống kê doanh thu, quản lý lịch chiếu.
  - Phát các **Domain Events** (`SEAT_STATUS_CHANGED`, `SEATS_BOOKED`) qua `eventBus` mà không phụ thuộc trực tiếp vào Socket.IO.
- **Domain Layer (`src/modules/booking/domain/*`)**:
  - `seatValidation.js`: Chứa các quy tắc nghiệp vụ thuần túy (Pure Domain Rules) kiểm tra tính hợp lệ khi chọn ghế: cùng loại ghế (`areSeatsSameType`), liên thông 4 hướng bằng thuật toán BFS (`areSeatsConnected`), và liền kề với cụm ghế đang giữ (`isNewSeatsAdjacentToExisting`).
  - `seatPricing.js`: Quy tắc tính giá vé theo hạng ghế (`standard`: `+0đ`, `vip`: `+20.000đ`, `sweetbox`: `+50.000đ`).
- **Infrastructure Layer (`src/infrastructure/*`, `src/modules/*/infrastructure/*.repository.js`)**:
  - **Repositories (`booking.repository.js`, `seat.repository.js`, `movie.repository.js`, `user.repository.js`)**: Cô lập hoàn toàn truy vấn Sequelize ORM, Raw SQL và quản lý Database Transaction.
  - **Redis Adapter (`redis.adapter.js`)**: Đóng gói các thao tác cache và thực thi **Lua Scripts nguyên tử** để giữ ghế, gia hạn TTL và giải phóng ghế theo đúng chủ sở hữu (`userId`).
  - **Redis Expired Listener (`redisExpired.listener.js`)**: Lắng nghe sự kiện `__keyevent@*__:expired` từ Redis khi khóa giữ ghế hết hạn để tự động phát sự kiện mở khóa ghế realtime.
  - **VNPay Gateway (`vnpay.gateway.js`)**: Đóng gói việc tạo URL thanh toán và kiểm tra chữ ký số `HMAC-SHA512` từ VNPay IPN.

```mermaid
flowchart TD
    Client["Client (Web / Mobile)"]
    VNPay["VNPay Payment Gateway"]

    subgraph Interface["Interface / Presentation Layer"]
        Routes["Express Routes & Middlewares"]
        Controllers["Controllers"]
        SocketAdapter["Socket.IO Handler (seatSocket.handler)"]
    end

    subgraph Application["Application Layer"]
        Services["Module Services (Booking, Payment, Movie, ...)"]
        CronJob["Cron Cleanup (cleanup.js)"]
        EventBus["Internal EventBus (domainEvents)"]
    end

    subgraph Domain["Domain Layer"]
        SeatValidation["Seat Validation Rules (BFS 4-way connectivity)"]
        SeatPricing["Seat Pricing Rules"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Repositories["Sequelize Repositories (MySQL Transactions & Locks)"]
        RedisAdapter["Redis Adapter (Atomic Lua Scripts)"]
        RedisExpired["Redis Keyspace Expired Listener"]
        VNPayGateway["VNPay Gateway Adapter"]
        MinIO["MinIO Storage Adapter"]
    end

    Client -->|HTTP REST API| Routes --> Controllers --> Services
    VNPay -->|GET /api/payments/vnpay_ipn| Routes
    Services --> SeatValidation
    Services --> SeatPricing
    Services --> Repositories
    Services --> RedisAdapter
    Services --> VNPayGateway
    Services --> MinIO
    CronJob --> Repositories
    CronJob --> Services
    RedisExpired -->|__keyevent@*__:expired| EventBus
    Services -->|Emit Domain Events| EventBus
    EventBus --> SocketAdapter
    SocketAdapter -->|WebSocket: seat_status_changed| Client
```

---

## 3. Cấu trúc thư mục (Project Structure)

```text
gzacinema-server/
├── src/
│   ├── app.js                                      # Khởi tạo Express, global middlewares, rate limiters, mount routes
│   ├── server.js                                   # Khởi tạo HTTP Server, Socket.IO, DB sync, Cron, Graceful Shutdown
│   ├── config/
│   │   ├── database.js                             # Cấu hình kết nối Sequelize MySQL
│   │   ├── minio.js                                # Cấu hình MinIO client, Multer upload & tự động tạo bucket
│   │   └── redis.js                                # Cấu hình ioredis client & Redis Pub/Sub subscriber
│   ├── core/
│   │   ├── cron/
│   │   │   └── cleanup.js                          # Cron job chạy mỗi phút dọn đơn pending quá 15 phút
│   │   ├── events/
│   │   │   ├── domainEvents.js                     # Định nghĩa hằng số sự kiện miền
│   │   │   └── eventBus.js                         # Singleton EventEmitter nội bộ
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js                  # Middleware verifyToken, verifyStaff, verifyAdmin
│   │   │   └── validate.middleware.js              # Middleware validate request body với Joi
│   │   └── utils/
│   │       ├── AppError.js                         # Lớp lỗi nghiệp vụ chuẩn hóa
│   │       ├── catchAsync.js                       # Wrapper bắt lỗi bất đồng bộ cho Controller
│   │       └── pagination.js                       # Tiện ích chuẩn hóa phân trang (parsePagination, formatPaginatedResult)
│   ├── infrastructure/
│   │   ├── cache/
│   │   │   ├── redis.adapter.js                    # Redis Adapter & các Lua script giữ/gia hạn/nhả ghế nguyên tử
│   │   │   └── redisExpired.listener.js            # Lắng nghe sự kiện hết hạn TTL của key hold_seat trên Redis
│   │   ├── gateways/
│   │   │   └── vnpay.gateway.js                    # Tích hợp cổng thanh toán VNPay (URL & IPN Signature)
│   │   └── sockets/
│   │       └── seatSocket.handler.js               # Quản lý room Socket.IO theo suất chiếu & phát sự kiện ghế
│   ├── models/                                     # Định nghĩa các Sequelize Models & Associations
│   │   ├── index.js
│   │   ├── user.model.js
│   │   ├── cinema.model.js
│   │   ├── room.model.js
│   │   ├── seat.model.js
│   │   ├── movie.model.js
│   │   ├── showtime.model.js
│   │   ├── booking.model.js
│   │   └── ticket.model.js
│   ├── modules/
│   │   ├── auth/                                   # Đăng ký, đăng nhập, đăng xuất, làm mới Access Token
│   │   ├── user/                                   # Hồ sơ cá nhân & lịch sử đặt vé (kèm user.repository.js)
│   │   ├── cinema/                                 # Quản lý cụm rạp (có cache Redis 24h)
│   │   ├── movie/                                  # Quản lý phim, bảng xếp hạng doanh thu/vé (kèm movie.repository.js)
│   │   ├── room/                                   # Quản lý phòng chiếu, tự động sinh lưới ghế & cập nhật trạng thái ghế
│   │   ├── showtime/                               # Quản lý suất chiếu & kiểm tra chống trùng lịch phòng chiếu
│   │   ├── booking/                                # Giữ ghế, bỏ giữ ghế, sơ đồ ghế (domain/ & infrastructure/)
│   │   ├── payment/                                # Tạo URL thanh toán VNPay & xử lý Webhook IPN
│   │   ├── ticket/                                 # Soát vé (Check-in) tại quầy cho nhân viên
│   │   └── statistic/                              # Thống kê doanh thu, vé bán, khách hàng (cache Redis 5 phút)
│   └── seeders/                                    # Kịch bản tạo dữ liệu mẫu (run-seed.js)
├── migrations/                                     # Các file migration cơ sở dữ liệu
├── postman/                                        # Bộ sưu tập Postman & biến môi trường kiểm thử
├── API_DOCS_FRONTEND.md                            # Tài liệu chi tiết tích hợp API dành cho Frontend
├── README.md                                       # Tài liệu tổng quan dự án
└── package.json
```

---

## 4. Cơ chế xử lý đồng thời & Khóa ghế (Concurrency & Seat Locking Mechanics)

Để ngăn chặn triệt để tình trạng **Double Booking** (nhiều người đặt trùng một ghế cùng lúc) và **Race Condition** giữa người dùng, cổng thanh toán VNPay và tiến trình dọn dẹp ngầm, hệ thống áp dụng cơ chế bảo vệ đa tầng:

1. **Giữ ghế tạm thời 5 phút (Atomic Multi-Key Lua Script)**:
   - Khi người dùng chọn một hoặc nhiều ghế (`POST /api/bookings/hold`), hệ thống kiểm tra tính hợp lệ của cụm ghế (cùng loại, liên thông 4 hướng bằng BFS) và gọi `redisAdapter.acquireOrExtendMultipleSeats()`.
   - Lua Script kiểm tra tất cả các key `hold_seat:{showtimeId}:{seatId}` theo nguyên tắc **All-or-Nothing**: nếu bất kỳ ghế nào đang bị giữ bởi người dùng khác, toàn bộ thao tác bị từ chối ngay lập tức; nếu hợp lệ, tất cả ghế được gán cho `userId` với **TTL = 300 giây (5 phút)**.
2. **Gia hạn giữ ghế 17 phút khi bước vào thanh toán (Compare-and-Expire Lua Script)**:
   - Khi gọi `POST /api/payments/create-payment-url`, hệ thống chạy `redisAdapter.extendMultipleSeats()` bằng Lua Script để kiểm tra toàn bộ ghế đang chọn có thực sự thuộc quyền sở hữu của `userId` hay không.
   - Nếu hợp lệ, TTL của tất cả các key giữ ghế được gia hạn nguyên tử lên **1020 giây (17 phút = 15 phút thời hạn giao dịch VNPay + 2 phút đệm xử lý IPN)**. Nếu bất kỳ ghế nào đã hết hạn hoặc bị người khác giữ, giao dịch bị chặn trước khi tạo đơn hàng.
3. **Giải phóng ghế an toàn (Compare-and-Delete Lua Script & Keyspace Notifications)**:
   - Khi người dùng chủ động bỏ chọn ghế (`POST /api/bookings/unhold`) hoặc khi đơn hàng bị hủy, hệ thống dùng Lua Script (`releaseSeat` / `releaseMultipleSeats`) chỉ xóa key Redis nếu giá trị hiện tại trùng khớp với `userId`, tuyệt đối không xóa nhầm khóa giữ chỗ mới của người dùng khác.
   - Nếu người dùng đóng trình duyệt và để hết hạn 5 phút, `redisExpired.listener.js` bắt sự kiện `__keyevent@*__:expired`, kiểm tra ghế chưa bán trong DB và phát sự kiện `seat_status_changed` (`status: 'available'`) qua Socket.IO.
4. **Khóa bi quan (Pessimistic Row Locking) khi xử lý VNPay IPN & Cron Cleanup**:
   - Trong `bookingRepository.markBookingPaid()`, hệ thống mở Transaction và khóa dòng `Booking` (`SELECT ... FOR UPDATE`), sau đó **khóa các dòng `Seat` theo thứ tự `id ASC`** (tránh Deadlock) rồi kiểm tra xem có bất kỳ vé hợp lệ nào (`valid`/`used`) thuộc đơn `paid` cho cùng suất chiếu hay chưa.
   - Nếu phát hiện ghế đã bán bởi giao dịch khác, đơn hàng hiện tại tự động chuyển sang `cancelled` và vé sang `refunded`.
   - Cron job `cleanup.js` (chạy mỗi phút đối với đơn `pending` quá 15 phút) và nhánh IPN thất bại cùng sử dụng `bookingRepository.cancelBookingAndTickets()` với khóa `FOR UPDATE` trên `Booking` (chỉ hủy khi `status === 'pending'`), sau đó gọi helper dùng chung `releaseCancelledBookingSeats()` để nhả khóa Redis an toàn và cập nhật realtime.
5. **Khóa giao dịch khi soát vé (Ticket Check-in Locking)**:
   - Khi nhân viên quét mã vé (`PUT /api/tickets/:id/checkin`), `ticket.service.js` sử dụng Transaction kèm `SELECT ... FOR UPDATE` trên dòng `Ticket` để đảm bảo mỗi vé chỉ có thể chuyển sang trạng thái `used` đúng một lần duy nhất.

---

## 5. Yêu cầu cài đặt & Khởi chạy nhanh (Quick Start)

### Yêu cầu hệ thống
- **Node.js** >= 18
- **npm** >= 9
- **MySQL** >= 8.0
- **Redis** >= 6.0 (khuyến nghị bật `notify-keyspace-events Ex`)
- **MinIO** (hoặc dịch vụ S3 tương thích)

### Các bước cài đặt

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Thiết lập biến môi trường**:
   Tạo file `.env` tại thư mục gốc `gzacinema-server/` theo mẫu ở mục **6. Biến môi trường**.

3. **Khởi tạo dữ liệu mẫu (Tùy chọn)**:
   ```bash
   npm run seed
   ```

4. **Khởi chạy máy chủ**:
   ```bash
   # Chế độ phát triển (tự động reload với nodemon)
   npm run dev

   # Chế độ production
   npm run start
   ```

5. **Kiểm tra trạng thái hoạt động**:
   - `GET http://localhost:5000/`
   - `GET http://localhost:5000/health`
   - `GET http://localhost:5000/api`

---

## 6. Biến môi trường (Environment Variables)

```env
# Server & Network
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
TRUST_PROXY=1

# Database (MySQL)
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gzacinema
DB_DIALECT=mysql
DB_ALTER_SYNC=false

# JWT Authentication
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis Cache & Seat Locking
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO Object Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=gzaminio
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=gzacinema
MINIO_PUBLIC_URL=https://gza-api.vulv.id.vn/storage

# VNPay Payment Gateway
VNP_TMNCODE=your_vnp_tmn_code
VNP_HASHSECRET=your_vnp_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/payment/success
```

---

## 7. Tổng hợp API Endpoints (API Route Summary)

### 7.1 Public Routes (Không yêu cầu đăng nhập)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/`, `/health`, `/api` | Kiểm tra trạng thái hoạt động của máy chủ (Health Check) |
| `POST` | `/api/auth/register` | Đăng ký tài khoản người dùng mới (`role: user`) |
| `POST` | `/api/auth/login` | Đăng nhập, trả về `accessToken` và gắn cookie `refreshToken` (`httpOnly`) |
| `POST` | `/api/auth/logout` | Đăng xuất và xóa cookie `refreshToken` |
| `POST` | `/api/auth/refresh` | Cấp lại `accessToken` mới từ cookie `refreshToken` |
| `GET` | `/api/cinemas` | Lấy danh sách tất cả các rạp chiếu (cache Redis 24 giờ) |
| `GET` | `/api/cinemas/:id` | Lấy thông tin chi tiết một rạp chiếu |
| `GET` | `/api/movies` | Lấy danh sách phim có phân trang & lọc theo trạng thái (`all`, `showing`, `coming_soon`) |
| `GET` | `/api/movies/ranking` | Lấy bảng xếp hạng phim ăn khách nhất theo số vé bán & doanh thu |
| `GET` | `/api/movies/:id` | Lấy thông tin chi tiết một bộ phim |
| `GET` | `/api/movies/:movieId/showtimes` | Lấy danh sách suất chiếu sắp tới của phim (gom nhóm theo rạp) |
| `GET` | `/api/payments/vnpay_ipn` | Webhook IPN để VNPay gọi ngầm xác nhận kết quả thanh toán |

### 7.2 Authenticated Routes (Yêu cầu `verifyToken`)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/users/profile` (hoặc `/api/users/me`) | Xem thông tin hồ sơ của người dùng đang đăng nhập |
| `PUT` | `/api/users/profile` (hoặc `/api/users/me`) | Cập nhật họ tên, số điện thoại hoặc đổi mật khẩu |
| `GET` | `/api/users/history` | Xem lịch sử đặt vé đã thanh toán (có phân trang) |
| `GET` | `/api/bookings/showtime/:showtimeId/seats` | Lấy sơ đồ ghế kèm trạng thái realtime của suất chiếu |
| `POST` | `/api/bookings/hold` | Giữ một hoặc nhiều ghế (`seatId` hoặc `seatIds`) trong 5 phút |
| `POST` | `/api/bookings/unhold` | Bỏ giữ một hoặc nhiều ghế (`seatId` hoặc `seatIds`) đang giữ |
| `POST` | `/api/payments/create-payment-url` | Khởi tạo đơn hàng `pending`, gia hạn giữ ghế 17 phút và nhận URL thanh toán VNPay |

### 7.3 Staff & Admin Routes (Yêu cầu `verifyToken` + `verifyStaff`)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/cinemas/:cinemaId/rooms` | Lấy danh sách các phòng chiếu thuộc một rạp |
| `PUT` | `/api/cinemas/:cinemaId/rooms/:roomId/seats/:seatId` | Cập nhật trạng thái vật lý của ghế (`available`, `broken`, `maintenance`) |
| `PUT` | `/api/tickets/:id/checkin` | Soát vé (chuyển trạng thái vé từ `valid` sang `used`) |

### 7.4 Admin Only Routes (Yêu cầu `verifyToken` + `verifyAdmin`)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/cinemas` | Thêm rạp chiếu mới |
| `PUT` | `/api/cinemas/:id` | Cập nhật thông tin rạp chiếu |
| `DELETE` | `/api/cinemas/:id` | Xóa rạp chiếu (chặn xóa nếu còn suất chiếu sắp tới) |
| `POST` | `/api/movies` | Thêm phim mới (hỗ trợ `multipart/form-data` upload `thumbnail` lên MinIO) |
| `PUT` | `/api/movies/:id` | Cập nhật thông tin phim & tự động dọn ảnh cũ trên MinIO |
| `DELETE` | `/api/movies/:id` | Xóa phim (chặn xóa nếu còn suất chiếu sắp tới) |
| `POST` | `/api/cinemas/:cinemaId/rooms` | Tạo phòng chiếu mới & tự động sinh lưới ghế (`standard`, `vip`, `sweetbox`) |
| `PUT` | `/api/cinemas/:cinemaId/rooms/:roomId` | Đổi tên phòng chiếu |
| `DELETE` | `/api/cinemas/:cinemaId/rooms/:roomId` | Xóa phòng chiếu và toàn bộ ghế (chặn xóa nếu đã có suất chiếu) |
| `POST` | `/api/showtimes` | Tạo suất chiếu mới (tự động tính `end_time` = `start_time` + thời lượng phim + 15 phút dọn phòng) |
| `GET` | `/api/showtimes` | Danh sách suất chiếu dành cho Admin (có phân trang & lọc theo `movie_id`) |
| `DELETE` | `/api/showtimes/:id` | Xóa suất chiếu (chặn xóa nếu đã có đơn đặt vé `paid`) |
| `GET` | `/api/bookings` | Quản lý danh sách đơn đặt vé (có phân trang & lọc theo `status`) |
| `GET` | `/api/statistics/dashboard` | Thống kê tổng doanh thu, số vé bán, tổng người dùng và doanh thu theo phim |

---

## 8. Tài liệu chi tiết & Kiểm thử

- **Tài liệu tích hợp cho Frontend**: Xem chi tiết cấu trúc Request Body, Query Params, Response mẫu và sự kiện Socket.IO tại file [`API_DOCS_FRONTEND.md`](./API_DOCS_FRONTEND.md).
- **Postman Collection**: Import file `postman/Gzacinema_API.postman_collection.json` và `postman/Gzacinema_Local.postman_environment.json` để kiểm thử nhanh toàn bộ API.
