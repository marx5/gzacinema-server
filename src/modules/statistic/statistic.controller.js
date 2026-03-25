const statisticService = require('./statistic.service');

const getDashboard = async (req, res) => {
    try {
        const stats = await statisticService.getDashboardStats(req.query);
        res.status(200).json({
            status: 'success',
            message: 'Dashboard statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

module.exports = {
    getDashboard
}