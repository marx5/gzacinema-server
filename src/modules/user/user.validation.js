const Joi = require('joi');

const updateProfileSchema = Joi.object({
    full_name: Joi.string().min(2).max(100),
    phone_number: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/).allow('', null),
    old_password: Joi.string().min(6),
    new_password: Joi.string().min(6)
})
    .and('old_password', 'new_password')
    .min(1);

module.exports = {
    updateProfileSchema
};
