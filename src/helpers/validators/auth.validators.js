const Joi = require('joi');

const { ROLE } = require('../constants');

/** Validates signup data */
const validateSignUpData = (data) => {
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
    password: Joi.string()
      .min(8)
      .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,}$/)
      .messages({
        'string.pattern.base': 'Password must contain at least one letter and one numeric digit',
      })
      .required(),
    role: Joi.string().valid(ROLE.PROMOTER, ROLE.SUPERVISOR).required(),
    inviteId: Joi.string().required(),
    agencyId: Joi.string(),
    clientId: Joi.string(),
  });

  return schema.validate(data);
};

/** Validates login data */
const validateLoginData = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};

/** Validates email */
const validateEmail = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  return schema.validate(data);
};

/** Validates phone number */
const validatePhoneNumber = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({
        'string.pattern.base': 'Phone number must be in international format',
      })
      .required(),
  });

  return schema.validate(data);
};

/** Validates email verification data */
const validateEmailVerificationData = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
  });

  return schema.validate(data);
};

/** Validates password reset data */
const validatePasswordResetData = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
    password: Joi.string()
      .min(8)
      .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,}$/)
      .messages({
        'string.pattern.base': 'Password must contain at least one letter and one numeric digit',
      })
      .required(),
  });

  return schema.validate(data);
};

/** Validates password update data */
const validatePasswordUpdateData = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .disallow(Joi.ref('currentPassword'))
      .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,}$/)
      .required()
      .messages({
        'any.required': '"newPassword" is required',
        'any.invalid': 'Please provide a new password',
        'string.pattern.base': 'Password must contain at least one letter and one numeric digit',
      }),
  });

  return schema.validate(data);
};

module.exports = {
  validateSignUpData,
  validateLoginData,
  validateEmail,
  validatePhoneNumber,
  validateEmailVerificationData,
  validatePasswordResetData,
  validatePasswordUpdateData,
};
