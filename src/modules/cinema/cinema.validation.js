const Joi = require('joi');

const createCinemaSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required()
})

const updateCinemaSchema = Joi.object({
    name: Joi.string(),
    address: Joi.string()
}).min(1);

module.exports = { createCinemaSchema, updateCinemaSchema }