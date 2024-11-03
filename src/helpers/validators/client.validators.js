const Joi = require('joi');

/** Validates client creation data */
const validateClientCreationData = (data) => {
  const schema = Joi.object({
    companyName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({ 'string.pattern.base': 'Phone number must be in international format' })
      .required(),
  });

  return schema.validate(data);
};

const validateClientUpdateData = (data) => {
  const schema = Joi.object({
    companyName: Joi.string(),
    email: Joi.string().email(),
    phoneNumber: Joi.string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .messages({ 'string.pattern.base': 'Phone number must be in international format' }),
    profilePicture: Joi.string(),
    address: Joi.string(),
  }).min(1);

  return schema.validate(data);
};

const validateStatesFilterGroupData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    states: Joi.array().items(Joi.string()).min(1).required(),
  });

  return schema.validate(data);
};

module.exports = {
  validateClientCreationData,
  validateClientUpdateData,
  validateStatesFilterGroupData,
};
