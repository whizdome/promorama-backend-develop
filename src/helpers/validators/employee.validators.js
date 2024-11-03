const Joi = require('joi');

const { ROLE } = require('../constants');

/** Validates employee creation data */
const validateEmployeeCreationData = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({
        'string.pattern.base': 'Phone number must be in international format',
      })
      .required(),
    role: Joi.string().valid(ROLE.PROMOTER, ROLE.SUPERVISOR).required(),
  });

  return schema.validate(data);
};

const validateEmployeeUpdateData = (data) => {
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({
        'string.pattern.base': 'Phone number must be in international format',
      }),
    role: Joi.string().valid(ROLE.PROMOTER, ROLE.SUPERVISOR),
    profilePicture: Joi.string(),
    address: Joi.string(),
  }).min(1);

  return schema.validate(data);
};

const validateInviteData = (data) => {
  const schema = Joi.object({
    role: Joi.string().valid(ROLE.PROMOTER, ROLE.SUPERVISOR).required(),
    emails: Joi.array().items(Joi.string().email()).min(1).required(),
  });

  return schema.validate(data);
};

module.exports = { validateEmployeeCreationData, validateEmployeeUpdateData, validateInviteData };
