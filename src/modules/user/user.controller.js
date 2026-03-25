const { User } = require('../../models');
const userService = require('./user.service');

const getMyProfile = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

const getMyHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await userService.getUserHistory(userId);

        res.status(200).json({
            status: 'success',
            data: history
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    getMyProfile,
    getMyHistory
}