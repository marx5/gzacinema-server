const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const registerUser = async (email, password) => {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        email,
        password: hashedPassword,
        role: 'user'
    });
    return newUser;
};

const loginUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
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
        throw new Error('Refresh token is missing');
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        const newAccessToken = jwt.sign({
            id: user.id,
            role: user.role
        }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
        })
        return newAccessToken;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
}

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken
};