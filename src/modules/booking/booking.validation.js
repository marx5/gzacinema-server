const Joi = require('joi');

const seatHoldSchema = Joi.object({
    showtimeId: Joi.string().uuid().required(),
    seatId: Joi.string().uuid(),
    seatIds: Joi.array().items(Joi.string().uuid()).min(1)
}).or('seatId', 'seatIds');

module.exports = {
    holdSeatSchema: seatHoldSchema,
    unholdSeatSchema: seatHoldSchema
};
