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

module.exports = {
    getMyProfile,
    getMyHistory,
    updateMyProfile
};