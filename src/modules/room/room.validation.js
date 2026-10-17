const joi = require('joi');

const createRoomSchema = joi.object({
    name: joi.string().required(),
    rowCount: joi.number().integer().min(1).max(26).default(5),
    colCount: joi.number().integer().min(1).max(30).default(10)
});

const updateRoomSchema = joi.object({
    name: joi.string(),
}).min(1);

const updateSeatStatusSchema = joi.object({
    status: joi.string().valid('available', 'broken', 'maintenance').required()
});

module.exports = { createRoomSchema, updateRoomSchema, updateSeatStatusSchema };