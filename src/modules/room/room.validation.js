const joi = require('joi');

const createRoomSchema = joi.object({
    name: joi.string().required(),
})

const updateRoomSchema = joi.object({
    name: joi.string(),
}).min(1);

module.exports = { createRoomSchema, updateRoomSchema }