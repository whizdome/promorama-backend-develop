const Joi = require('joi');

const validateAdminCreationData = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({ 'string.pattern.base': 'Phone number must be in international format' })
      .required(),
    password: Joi.string()
      .min(8)
      .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,}$/)
      .messages({
        'string.pattern.base': 'Password must contain at least one letter and one numeric digit',
      })
      .required(),
    makeSuperAdmin: Joi.boolean().options({ convert: false }),
  });

  return schema.validate(data);
};

const validateAdminUpdatesData = (data) => {
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({ 'string.pattern.base': 'Phone number must be in international format' }),
    profilePicture: Joi.string(),
  });

  return schema.validate(data);
};

module.exports = { validateAdminCreationData, validateAdminUpdatesData };
