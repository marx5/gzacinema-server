const AppError = require('../utils/AppError');

const validate = (schema) => async (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    req.body = value;
    next();
};

module.exports = validate;