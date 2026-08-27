const bcrypt = require('bcrypt');
const userRepository = require('./infrastructure/user.repository');
const AppError = require('../../core/utils/AppError');

const getUserHistory = async (userId, query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await userRepository.findUserHistory(userId, {
        limit,
        offset
    });

    return {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: page,
        history: rows
    };
};

const updateProfile = async (userId, data) => {
    const user = await userRepository.findById(userId);
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
};