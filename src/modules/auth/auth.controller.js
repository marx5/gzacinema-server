const authService = require('./auth.service');
const catchAsync = require('../../core/utils/catchAsync');

const register = catchAsync(async (req, res) => {
    const { full_name, email, password } = req.body;

    const newUser = await authService.registerUser(full_name, email, password);
    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name
        }
    });
})

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({
        status: 'success',
        message: 'Login successful',
        accessToken: accessToken,
        data: {
            id: user.id,
            email: user.email,
            role: user.role
        }
    });
})

const logout = catchAsync(async (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({
        status: 'success',
        message: 'Logout successful'
    });
});

const refreshToken = catchAsync(async (req, res) => {
    const tokenFromCookie = req.cookies.refreshToken;

    if (!tokenFromCookie) {
        return res.status(401).json({
            status: 'error',
            message: 'Refresh token is missing'
        });
    }

    const newAccessToken = await authService.refreshAccessToken(tokenFromCookie);
    res.status(200).json({
        status: 'success',
        accessToken: newAccessToken
    })
})

module.exports = {
    register,
    login,
    logout,
    refreshToken
};