const statisticService = require('./statistic.service');
const catchAsync = require('../../core/utils/catchAsync');

const getDashboard = catchAsync(async (req, res) => {
    const stats = await statisticService.getDashboardStats(req.query);
    res.status(200).json({
        status: 'success',
        message: 'Dashboard statistics retrieved successfully',
        data: stats
    });
});

module.exports = {
    getDashboard
}