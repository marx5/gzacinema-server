const { User } = require('../../models');
const userService = require('./user.service');
const catchAsync = require('../../core/utils/catchAsync');

const getMyProfile = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
        attributes: {
            exclude: ['password']
        }
    });
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: 'User not found'
        })
    }

    res.status(200).json({
        status: 'success',
        data: user
    })
})

const getMyHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const history = await userService.getUserHistory(userId);

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
}