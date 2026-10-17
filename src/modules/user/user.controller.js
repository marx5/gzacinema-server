const userService = require('./user.service');
const catchAsync = require('../../core/utils/catchAsync');

const getMyProfile = catchAsync(async (req, res) => {
    const user = await userService.getProfile(req.user.id);

    res.status(200).json({
        status: 'success',
        data: user
    });
});

const getMyHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const history = await userService.getUserHistory(userId, req.query);

    res.status(200).json({
        status: 'success',
        data: history
    });
});

const updateMyProfile = catchAsync(async (req, res) => {
    const updatedUser = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: updatedUser
    });
});

const getAllUsers = catchAsync(async (req, res) => {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json({
        status: 'success',
        data: result
    });
});

const createUser = catchAsync(async (req, res) => {
    const newUser = await userService.createUserByAdmin(req.body);
    res.status(201).json({
        status: 'success',
        message: 'Tạo tài khoản thành công',
        data: newUser
    });
});

const updateUser = catchAsync(async (req, res) => {
    const updatedUser = await userService.updateUserByAdmin(req.params.id, req.body, req.user.id);
    res.status(200).json({
        status: 'success',
        message: 'Cập nhật tài khoản thành công',
        data: updatedUser
    });
});

const deleteUser = catchAsync(async (req, res) => {
    const result = await userService.deleteUserByAdmin(req.params.id, req.user.id);
    res.status(200).json({
        status: 'success',
        message: result.message
    });
});

module.exports = {
    getMyProfile,
    getMyHistory,
    updateMyProfile,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
};