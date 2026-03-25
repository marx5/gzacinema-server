const authService = require('./auth.service');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        const newUser = await authService.registerUser(email, password);
        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                id: newUser.id,
                email: newUser.email
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}

const login = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: error.message
        });
    }
}

const logout = async (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({
        status: 'success',
        message: 'Logout successful'
    });
}

const refreshToken = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: error.message
        });
    }
}

module.exports = {
    register,
    login,
    logout,
    refreshToken
};