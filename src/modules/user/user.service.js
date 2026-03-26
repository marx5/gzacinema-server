const bcrypt = require('bcrypt');
const { where } = require('sequelize');
const { Booking, Ticket, Seat, Showtime, Movie, Room, User } = require('../../models');

const getUserHistory = async (userId, query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Booking.findAndCountAll({
        where: {
            user_id: userId,
            status: 'paid'
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
        include: [{
            model: Showtime,
            as: 'showtime',
            include: [
                {
                    model: Movie,
                    as: 'movie',
                    attributes: ['title', 'duration_minutes']
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['name']
                }
            ]
        },
        {
            model: Ticket,
            as: 'tickets',
            include: [{
                model: Seat,
                as: 'seat',
                attributes: ['row_letter', 'seat_number', 'type']
            }]
        }]
    });

    return {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: page,
        history: rows
    }
}

const updateProfile = async (userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    if (data.full_name) user.full_name = data.full_name;
    if (data.phone_number) user.phone_number = data.phone_number;

    if (data.old_password && data.new_password) {
        const isPasswordValid = await bcrypt.compare(data.old_password, user.password);
        if (!isPasswordValid) throw new AppError('Old password is incorrect', 400);

        user.password = await bcrypt.hash(data.new_password, 10);
    }

    await user.save();

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    return userWithoutPassword;
};

module.exports = {
    getUserHistory,
    updateProfile
}