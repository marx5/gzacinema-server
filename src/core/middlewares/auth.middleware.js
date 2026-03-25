const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'You are not authenticated or your token is missing'
        })
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token'
        })
    }
}

const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to perform this action'
        })
    }
    next();
}

const verifyStaff = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
        return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to perform this action'
        })
    }
    next();
}

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyStaff
}