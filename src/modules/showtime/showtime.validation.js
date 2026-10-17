const joi = require('joi');

const createShowtimeSchema = joi.object({
    movie_id: joi.string().uuid().required(),
    room_id: joi.string().uuid().required(),
    start_time: joi.date().iso().required(),
    base_price: joi.number().precision(2).required()
});

module.exports = { createShowtimeSchema };