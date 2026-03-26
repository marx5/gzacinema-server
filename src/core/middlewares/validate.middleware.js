const AppError = require('../utils/AppError');
const { cloudinary } = require('../../config/cloudinary');

const validate = (schema) => async (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        if (req.file && req.file.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (err) {
                console.error('Error deleting uploaded file after validation failure:', err);
            }
        }
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    next();
}


module.exports = validate;