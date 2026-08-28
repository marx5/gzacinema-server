'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const addDays = (baseDate, days) => {
      const result = new Date(baseDate);
      result.setDate(result.getDate() + days);
      return result;
    };

    // ==========================================
    // 1. SEED USERS (Admin, Staff, Users)
    // ==========================================
    const adminId = uuidv4();
    const staffId = uuidv4();
    const userId1 = uuidv4();
    const userId2 = uuidv4();

    const hashedPassword = await bcrypt.hash('123456', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        full_name: 'Super Admin',
        email: 'admin@gzacinema.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      },
      {
        id: staffId,
        full_name: 'Nhân viên Quầy vé',
        email: 'staff@gzacinema.com',
        password: hashedPassword,
        role: 'staff',
        createdAt: now,
        updatedAt: now
      },
      {
        id: userId1,
        full_name: 'Nguyễn Văn An (VIP)',
        email: 'user@gmail.com',
        password: hashedPassword,
        role: 'user',
        createdAt: now,
        updatedAt: now
      },
      {
        id: userId2,
        full_name: 'Trần Thị Mai',
        email: 'customer@gmail.com',
        password: hashedPassword,
        role: 'user',
        createdAt: now,
        updatedAt: now
      }
    ], {});

    // ==========================================
    // 2. SEED MOVIES (20 Đang Chiếu, 20 Sắp Chiếu - 40 Poster riêng biệt 100% 200 OK)
    // ==========================================
    const showingMoviesData = [
      {
        title: 'Dune: Hành Tinh Cát - Phần Hai',
        genre: 'Khoa Học Viễn Tưởng, Hành Động',
        duration_minutes: 166,
        description: 'Paul Atreides hợp lực cùng Chani và người Fremen để trả thù những kẻ đã hủy hoại gia đình mình.',
        daysAgo: 25,
        thumbnail: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=Way9Dexny3w'
      },
      {
        title: 'Kung Fu Panda 4',
        genre: 'Hoạt Hình, Hành Động, Hài Hước',
        duration_minutes: 94,
        description: 'Po chuẩn bị trở thành Thủ lĩnh Tinh thần của Thung lũng Hòa bình và phải tìm kiếm truyền nhân Thần Long Đại Hiệp mới.',
        daysAgo: 20,
        thumbnail: 'https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=_inKs4eeHiI'
      },
      {
        title: 'Godzilla x Kong: Đế Chế Mới',
        genre: 'Hành Động, Viễn Tưởng, Quái Thú',
        duration_minutes: 115,
        description: 'Hai biểu tượng quái vật hợp sức để chống lại một mối đe dọa khổng lồ ẩn sâu bên trong Trái Đất Rỗng.',
        daysAgo: 18,
        thumbnail: 'https://image.tmdb.org/t/p/w780/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=lV1OOlGwExg'
      },
      {
        title: 'Deadpool & Wolverine',
        genre: 'Hành Động, Hài Hước, Siêu Anh Hùng',
        duration_minutes: 128,
        description: 'Deadpool cùng Logan bắt tay trong một nhiệm vụ liên vũ trụ cứu lấy dòng thời gian với phong cách hài hước bùng nổ.',
        daysAgo: 15,
        thumbnail: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=73_1biulkYk'
      },
      {
        title: 'Những Mảnh Ghép Cảm Xúc 2 (Inside Out 2)',
        genre: 'Hoạt Hình, Gia Đình, Tâm Lý',
        duration_minutes: 96,
        description: 'Riley bước vào tuổi dậy thì với sự xuất hiện bất ngờ của cảm xúc mới: Lo Âu, Ganh Tị, Xấu Hổ và Chán Chường.',
        daysAgo: 14,
        thumbnail: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=LEjhY15eCx0'
      },
      {
        title: 'Hành Tinh Khỉ: Vương Quốc Mới',
        genre: 'Hành Động, Viễn Tưởng',
        duration_minutes: 145,
        description: 'Nhiều thế hệ sau thời kỳ của Caesar, một chú khỉ trẻ bắt đầu cuộc hành trình định đoạt tương lai của cả vượn và loài người.',
        daysAgo: 10,
        thumbnail: 'https://image.tmdb.org/t/p/w780/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=XtFI7SNtVpY'
      },
      {
        title: 'Oppenheimer',
        genre: 'Tiểu Sử, Kịch Tính, Lịch Sử',
        duration_minutes: 180,
        description: 'Câu chuyện cuộc đời nhà vật lý J. Robert Oppenheimer trong dự án Manhattan phát minh ra bom nguyên tử làm thay đổi thế giới.',
        daysAgo: 30,
        thumbnail: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=uYPbbksJxIg'
      },
      {
        title: 'Spider-Man: Du Hành Vũ Trụ Nhện',
        genre: 'Hoạt Hình, Hành Động, Siêu Anh Hùng',
        duration_minutes: 140,
        description: 'Miles Morales du hành qua đa vũ trụ nơi cậu gặp gỡ một đội ngũ Người Nhện chịu trách nhiệm bảo vệ sự tồn vong của thực tại.',
        daysAgo: 28,
        thumbnail: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=cqGjhVJWtEg'
      },
      {
        title: 'The Batman: Hiệp Sĩ Bóng Đêm',
        genre: 'Hành Động, Tội Phạm, Trinh Thám',
        duration_minutes: 176,
        description: 'Người Dơi khám phá mạng lưới tham nhũng sâu sắc tại Gotham trong khi truy lùng tên sát nhân bệnh hoạn Riddler.',
        daysAgo: 35,
        thumbnail: 'https://image.tmdb.org/t/p/w780/74xTEgt7R36Fpooo50r9T25onhq.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=mqqft2x_Aa4'
      },
      {
        title: 'Avatar: Dòng Chảy Của Nước',
        genre: 'Viễn Tưởng, Phiêu Lưu, Hành Động',
        duration_minutes: 192,
        description: 'Jake Sully và Neytiri xây dựng gia đình trên Pandora nhưng phải rời tổ ấm để khám phá các vùng biển kỳ vĩ khi kẻ thù trở lại.',
        daysAgo: 40,
        thumbnail: 'https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=d9MyW72ELq0'
      },
      {
        title: 'Phi Công Siêu Đẳng Maverick (Top Gun)',
        genre: 'Hành Động, Kịch Tính',
        duration_minutes: 130,
        description: 'Sau hơn 30 năm cống hiến, Pete Maverick Mitchell tiếp tục thử thách giới hạn của bản thân với tư cách là một phi công thử nghiệm dũng cảm.',
        daysAgo: 42,
        thumbnail: 'https://image.tmdb.org/t/p/w780/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=giXco2jaZ_4'
      },
      {
        title: 'Hố Đen Tử Thần (Interstellar)',
        genre: 'Khoa Học Viễn Tưởng, Phiêu Lưu',
        duration_minutes: 169,
        description: 'Một nhóm nhà thám hiểm du hành qua lỗ sâu không gian để tìm kiếm hành tinh sống mới cho nhân loại trước nguy cơ tuyệt chủng.',
        daysAgo: 45,
        thumbnail: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=zSWdZVtXT7E'
      },
      {
        title: 'Kẻ Đánh Cắp Giấc Mơ (Inception)',
        genre: 'Hành Động, Khoa Học Viễn Tưởng',
        duration_minutes: 148,
        description: 'Một tên trộm chuyên xâm nhập tiềm thức để đánh cắp bí mật được trao nhiệm vụ bất khả thi: cấy ghép một ý tưởng vào tâm trí mục tiêu.',
        daysAgo: 38,
        thumbnail: 'https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=YoHD9XEInc0'
      },
      {
        title: 'Ký Sinh Trùng (Parasite)',
        genre: 'Tâm Lý, Giật Gân, Hài Đen',
        duration_minutes: 132,
        description: 'Gia đình nghèo khó của Ki-taek dần thâm nhập vào cuộc sống của gia đình giàu có họ Park, dẫn đến chuỗi biến cố không thể lường trước.',
        daysAgo: 22,
        thumbnail: 'https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=5xH0hhJ98Xg'
      },
      {
        title: 'Vùng Đất Linh Hồn (Spirited Away)',
        genre: 'Hoạt Hình, Phiêu Lưu, Kỳ Ảo',
        duration_minutes: 125,
        description: 'Cô bé Chihiro lạc vào thế giới của các linh hồn ma thuật và phải dũng cảm làm việc tại nhà tắm công cộng để cứu cha mẹ mình.',
        daysAgo: 16,
        thumbnail: 'https://image.tmdb.org/t/p/w780/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=ByXuk9QqQkk'
      },
      {
        title: 'Your Name - Tên Cậu Là Gì?',
        genre: 'Hoạt Hình, Lãng Mạn, Giả Tưởng',
        duration_minutes: 107,
        description: 'Hai thiếu niên xa lạ ở hai vùng miền khác nhau bất ngờ hoán đổi thân xác và tìm cách kết nối trước một thảm họa thiên thạch.',
        daysAgo: 8,
        thumbnail: 'https://image.tmdb.org/t/p/w780/q719jXXEzOoYaps6babgKnONONX.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=s0wTdCQoc2k'
      },
      {
        title: 'Sát Thủ John Wick: Phần 4',
        genre: 'Hành Động, Tội Phạm, Giật Gân',
        duration_minutes: 169,
        description: 'John Wick đối đầu với những kẻ thù nguy hiểm nhất của Bàn Tối trên toàn cầu để giành lại tự do trọn vẹn cho chính mình.',
        daysAgo: 6,
        thumbnail: 'https://image.tmdb.org/t/p/w780/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=qEVUtrk8_B4'
      },
      {
        title: 'Avengers: Hồi Kết (Endgame)',
        genre: 'Hành Động, Viễn Tưởng, Siêu Anh Hùng',
        duration_minutes: 181,
        description: 'Sau cú búng tay tàn khốc của Thanos, các Avengers còn lại tập hợp để thực hiện một kế hoạch du hành thời gian mạo hiểm cứu vãn vũ trụ.',
        daysAgo: 4,
        thumbnail: 'https://image.tmdb.org/t/p/w780/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=TcMBFSGVi1c'
      },
      {
        title: 'Võ Sĩ Giác Đấu II (Gladiator II)',
        genre: 'Hành Động, Sử Thi, Kịch Tính',
        duration_minutes: 148,
        description: 'Nhiều năm sau sự hy sinh của Maximus, Lucius bị buộc phải bước vào Đấu Trường La Mã để đối mặt với những kẻ cai trị tàn bạo.',
        daysAgo: 1,
        thumbnail: 'https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=4rgYUipGJNo'
      },
      {
        title: 'Spider-Man: Không Còn Nhà (No Way Home)',
        genre: 'Hành Động, Viễn Tưởng, Phiêu Lưu',
        duration_minutes: 148,
        description: 'Danh tính bị bại lộ khiến cuộc sống của Peter Parker đảo lộn. Khi tìm đến Doctor Strange để giải cứu, cánh cửa đa vũ trụ vô tình mở ra.',
        daysAgo: 2,
        thumbnail: 'https://image.tmdb.org/t/p/w780/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=JfVOs4VSpmA'
      }
    ];

    const comingSoonMoviesData = [
      {
        title: 'Hành Trình Của Moana 2',
        genre: 'Hoạt Hình, Phiêu Lưu, Âm Nhạc',
        duration_minutes: 100,
        description: 'Moana và Maui tái hợp trong một chuyến hải trình hoàn toàn mới băng qua đại dương xa xôi theo lời kêu gọi của tổ tiên.',
        daysAhead: 5,
        thumbnail: 'https://image.tmdb.org/t/p/w780/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=hDZ7y8RP5HE'
      },
      {
        title: 'Bộ Tứ Siêu Đẳng: Những Bước Đi Đầu Tiên',
        genre: 'Hành Động, Viễn Tưởng, Phiêu Lưu',
        duration_minutes: 135,
        description: 'Gia đình siêu anh hùng biểu tượng đầu tiên của Marvel khám phá sức mạnh tối thượng và đối mặt với thực thể Galactus.',
        daysAhead: 10,
        thumbnail: 'https://image.tmdb.org/t/p/w780/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=1bHDWnXmK7Y'
      },
      {
        title: 'Kỵ Sĩ Bóng Đêm (The Dark Knight)',
        genre: 'Hành Động, Tội Phạm, Kịch Tính',
        duration_minutes: 152,
        description: 'Khi mối đe dọa được gọi là Joker gieo rắc sự hỗn loạn tại Gotham, Người Dơi phải chấp nhận một trong những thử nghiệm tâm lý lớn nhất.',
        daysAhead: 15,
        thumbnail: 'https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=EXeTwQWrcwY'
      },
      {
        title: 'Sàn Đấu Sinh Tử (Fight Club)',
        genre: 'Kịch Tính, Giật Gân, Tâm Lý',
        duration_minutes: 139,
        description: 'Một nhân viên văn phòng mắc chứng mất ngủ và một tay buôn xà phòng nổi loạn cùng nhau thành lập một câu lạc bộ ngầm bí mật.',
        daysAhead: 20,
        thumbnail: 'https://image.tmdb.org/t/p/w780/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=qtRKDV93JU8'
      },
      {
        title: 'Ma Trận (The Matrix)',
        genre: 'Hành Động, Khoa Học Viễn Tưởng',
        duration_minutes: 136,
        description: 'Một lập trình viên phát hiện ra thế giới thực chỉ là một mô phỏng máy tính tinh vi do máy móc thống trị tạo ra.',
        daysAhead: 25,
        thumbnail: 'https://image.tmdb.org/t/p/w780/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=vKQi3bBA1y8'
      },
      {
        title: 'Nhà Tù Shawshank (The Shawshank Redemption)',
        genre: 'Kịch Tính, Tội Phạm',
        duration_minutes: 142,
        description: 'Hai người đàn ông bị giam giữ gắn kết qua nhiều năm, tìm thấy niềm an ủi và sự cứu rỗi cuối cùng qua lòng nhân ái.',
        daysAhead: 30,
        thumbnail: 'https://image.tmdb.org/t/p/w780/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=PLl99DlL6b4'
      },
      {
        title: 'Coco: Cuộc Hội Ngộ Diệu Kỳ',
        genre: 'Hoạt Hình, Gia Đình, Âm Nhạc',
        duration_minutes: 105,
        description: 'Cậu bé yêu âm nhạc Miguel vô tình lạc vào Vùng Đất Linh Hồn rực rỡ và mở khóa bí mật gia tộc qua nhiều thế hệ.',
        daysAhead: 35,
        thumbnail: 'https://image.tmdb.org/t/p/w780/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=Rvr68u635R8'
      },
      {
        title: 'Robot Biết Yêu (WALL-E)',
        genre: 'Hoạt Hình, Viễn Tưởng, Phiêu Lưu',
        duration_minutes: 98,
        description: 'Một chú robot dọn rác nhỏ bé bị bỏ lại trên Trái Đất hoang tàn vô tình bước vào chuyến phiêu lưu không gian định đoạt vận mệnh nhân loại.',
        daysAhead: 40,
        thumbnail: 'https://image.tmdb.org/t/p/w780/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=CZ1CATNbXg0'
      },
      {
        title: 'Vua Sư Tử (The Lion King)',
        genre: 'Hoạt Hình, Phiêu Lưu, Gia Đình',
        duration_minutes: 118,
        description: 'Sư tử con Simba vượt qua bi kịch mất cha để trưởng thành và giành lại vị trí Chúa Tể Rừng Xanh đích thực từ kẻ phản bội.',
        daysAhead: 45,
        thumbnail: 'https://image.tmdb.org/t/p/w780/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=7TavVZMewpY'
      },
      {
        title: 'Tàu Titanic',
        genre: 'Lãng Mạn, Kịch Tính, Lịch Sử',
        duration_minutes: 194,
        description: 'Câu chuyện tình yêu kinh điển giữa Jack và Rose trên chuyến hải trình định mệnh của con tàu vĩ đại nhất lịch sử.',
        daysAhead: 50,
        thumbnail: 'https://image.tmdb.org/t/p/w780/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=kVrqfYjkTdQ'
      },
      {
        title: 'Gã Hề Joker',
        genre: 'Tội Phạm, Giật Gân, Tâm Lý',
        duration_minutes: 122,
        description: 'Sự tha hóa của một diễn viên hài thất bại Arthur Fleck trở thành biểu tượng hỗn loạn khét tiếng nhất thành phố Gotham.',
        daysAhead: 55,
        thumbnail: 'https://image.tmdb.org/t/p/w780/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=zAGVQLHvwOY'
      },
      {
        title: 'Biệt Đội Siêu Anh Hùng (The Avengers)',
        genre: 'Hành Động, Viễn Tưởng, Phiêu Lưu',
        duration_minutes: 143,
        description: 'Các siêu anh hùng mạnh nhất Trái Đất lần đầu tiên tập hợp để ngăn chặn Loki và đội quân ngoài hành tinh xâm chiếm thế giới.',
        daysAhead: 60,
        thumbnail: 'https://image.tmdb.org/t/p/w780/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=eOrNdBpGMv8'
      },
      {
        title: 'Chiến Binh Báo Đen (Black Panther)',
        genre: 'Hành Động, Phiêu Lưu, Viễn Tưởng',
        duration_minutes: 134,
        description: 'TChalla trở về vương quốc Wakanda công nghệ tân tiến để kế vị ngai vàng và bảo vệ đất nước trước kẻ thù truyền kiếp.',
        daysAhead: 65,
        thumbnail: 'https://image.tmdb.org/t/p/w780/uxzzxijgPIY7slzFvMotPv8wjKA.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=xjDjIWPwcPU'
      },
      {
        title: 'Người Sắt (Iron Man)',
        genre: 'Hành Động, Khoa Học Viễn Tưởng',
        duration_minutes: 126,
        description: 'Tỷ phú Tony Stark chế tạo bộ giáp bọc thép công nghệ cao sau khi bị bắt cóc và trở thành siêu anh hùng Người Sắt.',
        daysAhead: 70,
        thumbnail: 'https://image.tmdb.org/t/p/w780/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=8ugaeA-nMTc'
      },
      {
        title: 'Avengers: Cuộc Chiến Vô Cực (Infinity War)',
        genre: 'Hành Động, Viễn Tưởng, Phiêu Lưu',
        duration_minutes: 149,
        description: 'Biệt đội Avengers và các đồng minh phải sẵn sàng hy sinh tất cả trong nỗ lực đánh bại Thanos quyền năng trước khi hắn thu thập đủ 6 Viên Đá Vô Cực.',
        daysAhead: 75,
        thumbnail: 'https://image.tmdb.org/t/p/w780/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=6ZfuNTqbHE8'
      },
      {
        title: 'Vút Bay (Up)',
        genre: 'Hoạt Hình, Phiêu Lưu, Hài Hước',
        duration_minutes: 96,
        description: 'Ông lão Carl thực hiện ước mơ bay đến Thác Nước Thiên Đường bằng ngôi nhà buộc hàng ngàn quả bóng bay cùng cậu bé hướng đạo sinh Russell.',
        daysAhead: 80,
        thumbnail: 'https://image.tmdb.org/t/p/w780/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=ORFWDXl_zJ4'
      },
      {
        title: 'Kỵ Sĩ Bóng Đêm Trỗi Dậy (The Dark Knight Rises)',
        genre: 'Hành Động, Tội Phạm, Giật Gân',
        duration_minutes: 164,
        description: 'Tám năm sau cái chết của Harvey Dent, Batman buộc phải trở lại để bảo vệ Gotham khỏi tên khủng bố tàn bạo Bane.',
        daysAhead: 85,
        thumbnail: 'https://image.tmdb.org/t/p/w780/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=g8evyE9TuYg'
      },
      {
        title: 'Avatar: Hành Tinh Pandora',
        genre: 'Viễn Tưởng, Phiêu Lưu, Hành Động',
        duration_minutes: 162,
        description: 'Cựu lính thủy đánh bộ Jake Sully thâm nhập vào bộ tộc Na\'vi trên hành tinh Pandora kỳ vĩ và đứng trước sự lựa chọn sinh tử.',
        daysAhead: 90,
        thumbnail: 'https://image.tmdb.org/t/p/w780/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=5PSNL1qE6VY'
      },
      {
        title: 'Phù Thủy Tối Thượng: Đa Vũ Trụ Hỗn Loạn',
        genre: 'Hành Động, Giả Tưởng, Phiêu Lưu',
        duration_minutes: 126,
        description: 'Doctor Strange mở khóa đa vũ trụ và khám phá những chiều không gian kỳ bí đầy hiểm nguy cùng America Chavez.',
        daysAhead: 95,
        thumbnail: 'https://image.tmdb.org/t/p/w780/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=aWzlQ2N6qqg'
      },
      {
        title: 'Chiến Tranh Giữa Các Vì Sao (Star Wars)',
        genre: 'Khoa Học Viễn Tưởng, Phiêu Lưu, Hành Động',
        duration_minutes: 121,
        description: 'Luke Skywalker gia nhập lực lượng Hiệp Sĩ Jedi và Công chúa Leia trong cuộc chiến vĩ đại chống lại Đế Chế Ngân Hà tàn bạo.',
        daysAhead: 100,
        thumbnail: 'https://image.tmdb.org/t/p/w780/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
        trailer_url: 'https://www.youtube.com/watch?v=vZ734NWnAHA'
      }
    ];

    const showingMovies = showingMoviesData.map(m => ({
      id: uuidv4(),
      title: m.title,
      genre: m.genre,
      description: m.description,
      duration_minutes: m.duration_minutes,
      release_date: formatDate(addDays(now, -m.daysAgo)),
      thumbnail: m.thumbnail,
      trailer_url: m.trailer_url,
      createdAt: now,
      updatedAt: now
    }));

    const comingSoonMovies = comingSoonMoviesData.map(m => ({
      id: uuidv4(),
      title: m.title,
      genre: m.genre,
      description: m.description,
      duration_minutes: m.duration_minutes,
      release_date: formatDate(addDays(now, m.daysAhead)),
      thumbnail: m.thumbnail,
      trailer_url: m.trailer_url,
      createdAt: now,
      updatedAt: now
    }));

    const allMovies = [...showingMovies, ...comingSoonMovies];
    await queryInterface.bulkInsert('movies', allMovies, {});

    // ==========================================
    // 3. SEED 5 CINEMAS (5 Cụm Rạp Lớn)
    // ==========================================
    const cinemaConfigs = [
      {
        name: 'GzaCinema Vincom Bà Triệu Hà Nội',
        address: 'Tầng 6, Vincom Center, 191 Bà Triệu, Q. Hai Bà Trưng, Hà Nội'
      },
      {
        name: 'GzaCinema Landmark 81 TP.HCM',
        address: 'Tầng B1, TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ, Q. Bình Thạnh, TP.HCM'
      },
      {
        name: 'GzaCinema Crescent Mall TP.HCM',
        address: 'Tầng 5, Crescent Mall, 101 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM'
      },
      {
        name: 'GzaCinema Vincom Ngô Quyền Đà Nẵng',
        address: 'Tầng 4, TTTM Vincom Plaza, 910A Ngô Quyền, Q. Sơn Trà, TP. Đà Nẵng'
      },
      {
        name: 'GzaCinema Vincom Plaza Cần Thơ',
        address: 'Tầng 5, TTTM Vincom Plaza Xuân Khánh, 209 Đường 30/4, Q. Ninh Kiều, TP. Cần Thơ'
      }
    ];

    const cinemas = cinemaConfigs.map(c => ({
      id: uuidv4(),
      name: c.name,
      address: c.address,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('cinemas', cinemas, {});

    // ==========================================
    // 4. SEED 10 ROOMS MỖI RẠP (TỔNG 50 PHÒNG) & GHẾ TỪ 50 ĐẾN 200
    // ==========================================
    const roomTemplates = [
      { name: 'IMAX Laser 01', rows: 12, cols: 16, basePrice: 150000 },       // 192 ghế
      { name: 'ScreenX 02', rows: 10, cols: 14, basePrice: 130000 },          // 140 ghế
      { name: '4DX Dolby Atmos 03', rows: 8, cols: 10, basePrice: 140000 },    // 80 ghế
      { name: 'Cinema 04 - Prime', rows: 8, cols: 12, basePrice: 90000 },       // 96 ghế
      { name: 'Cinema 05 - Standard', rows: 7, cols: 10, basePrice: 80000 },    // 70 ghế
      { name: 'Cinema 06 - Standard', rows: 8, cols: 11, basePrice: 85000 },    // 88 ghế
      { name: 'Cinema 07 - Digital', rows: 9, cols: 12, basePrice: 95000 },     // 108 ghế
      { name: 'Cinema 08 - Digital', rows: 10, cols: 12, basePrice: 100000 },   // 120 ghế
      { name: 'VIP Gold Class 09', rows: 5, cols: 10, basePrice: 160000 },     // 50 ghế
      { name: 'Sweetbox Lounge 10', rows: 6, cols: 10, basePrice: 110000 }      // 60 ghế
    ];

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const allRooms = [];
    const allSeats = [];

    cinemas.forEach(cinema => {
      roomTemplates.forEach((tpl) => {
        const roomId = uuidv4();
        allRooms.push({
          id: roomId,
          name: tpl.name,
          cinema_id: cinema.id,
          createdAt: now,
          updatedAt: now,
          _basePrice: tpl.basePrice
        });

        // Tạo ghế cho phòng
        for (let r = 0; r < tpl.rows; r++) {
          const rowLetter = alphabet[r];
          for (let c = 1; c <= tpl.cols; c++) {
            let seatType = 'standard';
            if (r === tpl.rows - 1) {
              seatType = 'sweetbox';
            } else if (r >= Math.floor(tpl.rows * 0.4)) {
              seatType = 'vip';
            }

            allSeats.push({
              id: uuidv4(),
              room_id: roomId,
              row_letter: rowLetter,
              seat_number: c,
              type: seatType,
              status: 'available',
              createdAt: now,
              updatedAt: now
            });
          }
        }
      });
    });

    // Bulk insert 50 phòng chiếu
    const roomsToInsert = allRooms.map(({ _basePrice, ...rest }) => rest);
    await queryInterface.bulkInsert('rooms', roomsToInsert, {});

    // Bulk insert seats theo từng chunk
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < allSeats.length; i += CHUNK_SIZE) {
      const seatChunk = allSeats.slice(i, i + CHUNK_SIZE);
      await queryInterface.bulkInsert('seats', seatChunk, {});
    }

    // ==========================================
    // 5. SEED SHOWTIMES (Suất chiếu phù hợp cho 20 phim đang chiếu)
    // ==========================================
    const timeSlots = [
      { hours: 9, minutes: 30 },
      { hours: 13, minutes: 30 },
      { hours: 17, minutes: 30 },
      { hours: 21, minutes: 0 }
    ];

    const allShowtimes = [];
    let movieIndex = 0;

    // Duyệt qua 7 ngày tới (từ hôm nay D+0 đến D+6)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = addDays(now, dayOffset);

      allRooms.forEach(room => {
        timeSlots.forEach(slot => {
          const selectedMovie = showingMovies[movieIndex % showingMovies.length];
          movieIndex++;

          const startTime = new Date(showDate);
          startTime.setHours(slot.hours, slot.minutes, 0, 0);

          const cleanUpMinutes = 15;
          const endTime = new Date(startTime.getTime() + (selectedMovie.duration_minutes + cleanUpMinutes) * 60000);

          allShowtimes.push({
            id: uuidv4(),
            movie_id: selectedMovie.id,
            room_id: room.id,
            start_time: startTime,
            end_time: endTime,
            base_price: room._basePrice || 90000.00,
            createdAt: now,
            updatedAt: now
          });
        });
      });
    }

    // Bulk insert showtimes theo chunk
    for (let i = 0; i < allShowtimes.length; i += CHUNK_SIZE) {
      const showtimeChunk = allShowtimes.slice(i, i + CHUNK_SIZE);
      await queryInterface.bulkInsert('showtimes', showtimeChunk, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('showtimes', null, {});
    await queryInterface.bulkDelete('seats', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('cinemas', null, {});
    await queryInterface.bulkDelete('movies', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};