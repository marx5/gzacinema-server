const Joi = require('joi');

const seatHoldSchema = Joi.object({
    showtimeId: Joi.string().uuid().required(),
    seatId: Joi.string().uuid(),
    seatIds: Joi.array().items(Joi.string().uuid()).min(1)
}).or('seatId', 'seatIds');

const unholdAllSchema = Joi.object({
    showtimeId: Joi.string().uuid().required()
});

const updateBookingStatusSchema = Joi.object({
    status: Joi.string().valid('paid', 'cancelled').required()
});

module.exports = {
    holdSeatSchema: seatHoldSchema,
    unholdSeatSchema: seatHoldSchema,
    unholdAllSchema,
    updateBookingStatusSchema
};

