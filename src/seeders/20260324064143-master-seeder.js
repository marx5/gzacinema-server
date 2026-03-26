'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ==========================================
    // 1. SEED USERS (Admin, Staff, User)
    // ==========================================
    const adminId = uuidv4();
    const staffId = uuidv4();
    const userId = uuidv4();

    // Mật khẩu chung là: 123456
    const hashedPassword = await bcrypt.hash('123456', 10);

    await queryInterface.bulkInsert('users', [
      { id: adminId, full_name: 'Super Admin', email: 'admin@gzacinema.com', password: hashedPassword, role: 'admin', createdAt: now, updatedAt: now },
      { id: staffId, full_name: 'Nhân viên Rạp', email: 'staff@gzacinema.com', password: hashedPassword, role: 'staff', createdAt: now, updatedAt: now },
      { id: userId, full_name: 'Khách Hàng VIP', email: 'user@gmail.com', password: hashedPassword, role: 'user', createdAt: now, updatedAt: now }
    ], {});

    // ==========================================
    // 2. SEED MOVIES (Phim)
    // ==========================================
    const movieId1 = uuidv4();
    const movieId2 = uuidv4();

    await queryInterface.bulkInsert('movies', [
      {
        id: movieId1,
        title: 'Dune: Part Two',
        description: 'Hành trình thần thoại của Paul Atreides khi anh hợp nhất với Chani và người Fremen.',
        duration_minutes: 166,
        release_date: '2024-03-01',
        createdAt: now, updatedAt: now
      },
      {
        id: movieId2,
        title: 'Kung Fu Panda 4',
        description: 'Po phải đối mặt với một kẻ thù mới có khả năng biến hình thành những kẻ thù cũ.',
        duration_minutes: 94,
        release_date: '2024-03-08',
        createdAt: now, updatedAt: now
      }
    ], {});

    // ==========================================
    // 3. SEED CINEMAS (Rạp)
    // ==========================================
    const cinemaId = uuidv4();

    await queryInterface.bulkInsert('cinemas', [
      {
        id: cinemaId,
        name: 'GzaCinema Hà Nội',
        address: 'Tầng 5, Vincom Center, Bà Triệu, Hà Nội',
        createdAt: now, updatedAt: now
      }
    ], {});

    // ==========================================
    // 4. SEED ROOMS & SEATS (Phòng & Ghế)
    // ==========================================
    const roomId1 = uuidv4();
    const roomId2 = uuidv4();

    await queryInterface.bulkInsert('rooms', [
      { id: roomId1, name: 'IMAX 01', cinema_id: cinemaId, createdAt: now, updatedAt: now },
      { id: roomId2, name: 'Room 3D', cinema_id: cinemaId, createdAt: now, updatedAt: now }
    ], {});

    // Hàm tạo mảng ghế (Logic giống room.service.js)
    const generateSeatsForRoom = (roomId) => {
      const seats = [];
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const rowCount = 5;
      const colCount = 10;

      for (let row = 0; row < rowCount; row++) {
        const rowLetter = alphabet[row];
        for (let col = 1; col <= colCount; col++) {
          let seatType = 'standard';
          if (row === rowCount - 1) seatType = 'sweetbox';
          else if (row >= rowCount - 3) seatType = 'vip';

          seats.push({
            id: uuidv4(),
            room_id: roomId,
            row_letter: rowLetter,
            seat_number: col,
            type: seatType,
            status: 'available',
            createdAt: now,
            updatedAt: now
          });
        }
      }
      return seats;
    };

    const allSeats = [
      ...generateSeatsForRoom(roomId1),
      ...generateSeatsForRoom(roomId2)
    ];

    await queryInterface.bulkInsert('seats', allSeats, {});

    // ==========================================
    // 5. SEED SHOWTIMES (Suất chiếu)
    // ==========================================
    const showtimeId1 = uuidv4();

    // Suất chiếu ngày mai (cho Dune)
    const startTime1 = new Date();
    startTime1.setDate(startTime1.getDate() + 1);
    startTime1.setHours(19, 0, 0, 0); // 19:00 ngày mai

    // Tính giờ kết thúc (Thời lượng phim 166p + 15p dọn dẹp)
    const endTime1 = new Date(startTime1.getTime() + (166 + 15) * 60000);

    await queryInterface.bulkInsert('showtimes', [
      {
        id: showtimeId1,
        movie_id: movieId1,
        room_id: roomId1,
        start_time: startTime1,
        end_time: endTime1,
        base_price: 80000.00,
        createdAt: now, updatedAt: now
      }
    ], {});

  },

  async down(queryInterface, Sequelize) {
    // Xóa theo thứ tự ngược lại để tránh dính khóa ngoại (Foreign Key constraint)
    await queryInterface.bulkDelete('showtimes', null, {});
    await queryInterface.bulkDelete('seats', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('cinemas', null, {});
    await queryInterface.bulkDelete('movies', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};