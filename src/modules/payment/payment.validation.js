const Joi = require('joi');

const createPaymentSchema = Joi.object({
    showtimeId: Joi.string().uuid().required(),
    seatIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

module.exports = {
    createPaymentSchema
};
