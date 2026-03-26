const Joi = require('joi');

const createMovieSchema = Joi.object({
    title: Joi.string().required(),
    genre: Joi.string().allow('', null),
    description: Joi.string().required(),
    duration_minutes: Joi.number().integer().min(1).required(),
    release_date: Joi.date().iso().required(),
    trailer_url: Joi.string().uri().allow('', null)
})

const updateMovieSchema = Joi.object({
    title: Joi.string(),
    genre: Joi.string().allow('', null),
    description: Joi.string(),
    duration_minutes: Joi.number().integer().min(1),
    trailer_url: Joi.string().uri().allow('', null)
}).min(1);

module.exports = { createMovieSchema, updateMovieSchema }