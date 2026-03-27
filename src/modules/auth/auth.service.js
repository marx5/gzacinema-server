const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const AppError = require('../../core/utils/AppError');

const registerUser = async (full_name, email, password) => {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        full_name,
        email,
        password: hashedPassword,
        role: 'user'
    });
    return newUser;
};

const loginUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new AppError('Invalid email or password', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 400);
    }

    const accessToken = jwt.sign({
        id: user.id,
        role: user.role
    }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
    });

    const refreshToken = jwt.sign({
        id: user.id
    }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    });

    return { user, accessToken, refreshToken };
}

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError('Refresh token is missing', 400);
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const newAccessToken = jwt.sign({
            id: user.id,
            role: user.role
        }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
        })
        return newAccessToken;
    } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
}

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken
};