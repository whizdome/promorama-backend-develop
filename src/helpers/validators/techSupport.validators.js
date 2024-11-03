const Joi = require('joi');

const createTicketJoi = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  fullName: Joi.string().required().messages({
    'string.reference': 'invalid full name format',
    'any.required': 'full name is required',
  }),
  userId: Joi.string().min(8).required().messages({
    'any.required': 'userId is required',
  }),
  description: Joi.string().min(10).required().messages({
    'string.reference': 'invalid description format',
    'any.required': 'description is required',
  }),
});

module.exports = {
  createTicketJoi,
};
