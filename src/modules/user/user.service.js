const bcrypt = require('bcrypt');
const userRepository = require('./infrastructure/user.repository');
const AppError = require('../../core/utils/AppError');
const { parsePagination, formatPaginatedResult } = require('../../core/utils/pagination');

const getProfile = async (userId) => {
    const user = await userRepository.findByIdWithoutPassword(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

const getUserHistory = async (userId, query = {}) => {
    const { page, limit, offset } = parsePagination(query);

    const { count, rows } = await userRepository.findUserHistory(userId, {
        limit,
        offset
    });

    return formatPaginatedResult({
        count,
        rows,
        page,
        limit,
        dataKey: 'history'
    });
};

const updateProfile = async (userId, data) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (data.full_name) user.full_name = data.full_name;
    if (data.phone_number !== undefined) user.phone_number = data.phone_number;

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
    getProfile,
    getUserHistory,
    updateProfile
};