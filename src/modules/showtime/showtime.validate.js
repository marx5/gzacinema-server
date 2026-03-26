const joi = require('joi');

const createShowtimeSchema = joi.object({
    movie_id: joi.string().uuid().required(),
    room_id: joi.string().uuid().required(),
    start_time: joi.date().iso().required(),
    base_price: joi.number().precision(2).required()
})

const updateShowtimeSchema = joi.object({
    movie_id: joi.string().uuid(),
    room_id: joi.string().uuid(),
    start_time: joi.date().iso(),
    base_price: joi.number().precision(2)
}).min(1);

module.exports = { createShowtimeSchema, updateShowtimeSchema }