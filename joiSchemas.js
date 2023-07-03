const BaseJoi = require('joi');

const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': 'You cannot enter HTML tags.',
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean == value) {
                    return clean;
                }
                return helpers.error('string.escapeHTML', { value })
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);

module.exports.userSchema = Joi.object({
    user: Joi.object({
        name: Joi.string().required().escapeHTML(),
        email: Joi.string().required().escapeHTML(),
        username: Joi.string().required().escapeHTML(),
        password: Joi.string().required().escapeHTML(),
    }).required(),
});
