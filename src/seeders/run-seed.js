'use strict';
require('dotenv').config();
const { sequelize } = require('../config/database');
const redis = require('../config/redis');
const masterSeeder = require('./20260324064143-master-seeder');

async function runSeeder() {
  console.log('🚀 Đang kết nối Cơ sở dữ liệu...');
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối CSDL thành công.');

    const queryInterface = sequelize.getQueryInterface();

    console.log('🧹 Đang làm sạch dữ liệu mẫu cũ...');
    await masterSeeder.down(queryInterface, sequelize.Sequelize);
    console.log('✅ Đã dọn dẹp dữ liệu cũ thành công.');

    console.log('🌱 Đang nạp dữ liệu mẫu mới (Seed Data)...');
    await masterSeeder.up(queryInterface, sequelize.Sequelize);
    console.log('🎉 Nạp dữ liệu Seed thành công!');
    console.log('   - 40 Phim (20 Đang chiếu, 20 Sắp chiếu - 40 Poster TMDB riêng biệt 100% 200 OK)');
    console.log('   - 5 Cụm rạp lớn tại Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ');
    console.log('   - 50 Phòng chiếu (10 phòng/rạp)');
    console.log('   - Hơn 5.000 ghế (50-192 ghế/phòng, phân bổ Standard, VIP, Sweetbox)');
    console.log('   - Hơn 1.400 Suất chiếu cho 7 ngày tới (không trùng phòng)');

    // Xóa cache Redis nếu có
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const keys = await redis.keys('cache:*');
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`🧹 Đã làm sạch ${keys.length} keys cache Redis.`);
        }
      }
    } catch (redisErr) {
      console.log('ℹ️ Bỏ qua dọn dẹp cache Redis do không kết nối được.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi thực thi Seeder:', error);
    process.exit(1);
  }
}

runSeeder();
