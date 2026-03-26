const joi = require('joi');

const createRoomSchema = joi.object({
    name: joi.string().required(),
    cinema_id: joi.number().integer().required()
})

const updateRoomSchema = joi.object({
    name: joi.string(),
    cinema_id: joi.number().integer()
}).min(1);

module.exports = { createRoomSchema, updateRoomSchema }