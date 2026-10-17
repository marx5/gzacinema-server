const bcrypt = require('bcrypt');
const userRepository = require('./infrastructure/user.repository');
const AppError = require('../../core/utils/AppError');
const { parsePagination, formatPaginatedResult } = require('../../core/utils/pagination');

const getProfile = async (userId) => {
    const [user, stats] = await Promise.all([
        userRepository.findByIdWithoutPassword(userId),
        userRepository.getUserStats(userId)
    ]);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return {
        ...user.toJSON(),
        stats
    };
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
        if (!isPasswordValid) throw new AppError('Mật khẩu hiện tại không chính xác', 400);

        user.password = await bcrypt.hash(data.new_password, 10);
    }

    await user.save();

    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    return userWithoutPassword;
};

const getAllUsers = async (query = {}) => {
    const { page, limit, offset } = parsePagination(query, { defaultLimit: 12, maxLimit: 100 });
    const { role, search } = query;

    const [{ count, rows }, summary] = await Promise.all([
        userRepository.findAllUsers({ role, search, limit, offset }),
        userRepository.getRoleSummary()
    ]);

    const paginated = formatPaginatedResult({
        count,
        rows,
        page,
        limit,
        dataKey: 'users'
    });

    return {
        ...paginated,
        summary
    };
};

const createUserByAdmin = async (data) => {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
        throw new AppError('Email này đã được sử dụng trong hệ thống', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await userRepository.create({
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number || null,
        password: hashedPassword,
        role: data.role || 'user'
    });

    const userJson = newUser.toJSON();
    delete userJson.password;
    return userJson;
};

const updateUserByAdmin = async (targetUserId, data, currentAdminId) => {
    const user = await userRepository.findById(targetUserId);
    if (!user) {
        throw new AppError('Không tìm thấy tài khoản người dùng', 404);
    }

    if (String(targetUserId) === String(currentAdminId) && data.role && data.role !== 'admin') {
        throw new AppError('Không thể tự hạ quyền Quản trị viên của chính mình', 400);
    }

    if (data.full_name !== undefined) user.full_name = data.full_name;
    if (data.phone_number !== undefined) user.phone_number = data.phone_number || null;
    if (data.role !== undefined) user.role = data.role;

    if (data.password && data.password.trim().length >= 6) {
        user.password = await bcrypt.hash(data.password.trim(), 10);
    }

    await user.save();

    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
};

const deleteUserByAdmin = async (targetUserId, currentAdminId) => {
    if (String(targetUserId) === String(currentAdminId)) {
        throw new AppError('Không thể tự xóa tài khoản của chính mình', 400);
    }

    const user = await userRepository.findById(targetUserId);
    if (!user) {
        throw new AppError('Không tìm thấy tài khoản người dùng', 404);
    }

    await user.destroy();
    return { message: 'Đã xóa tài khoản người dùng thành công' };
};

module.exports = {
    getProfile,
    getUserHistory,
    updateProfile,
    getAllUsers,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin
};
