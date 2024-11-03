const Joi = require('joi');

const validateInfoData = (data) => {
  const schema = Joi.object({
    clientId: Joi.string().min(24).max(24).required(),
    initiativeId: Joi.string().min(24).max(24),
    name: Joi.string().required(),
    description: Joi.string(),
  });

  return schema.validate(data);
};

const validateQuestionData = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    fieldName: Joi.string().required(),
    fieldType: Joi.string()
      .valid('text', 'select', 'textarea', 'email', 'tel', 'image', 'checkbox', 'radio', 'date')
      .required(),
    fieldOptions: Joi.array().items(Joi.string()).min(1),
    isRequired: Joi.boolean().options({ convert: false }).required(),
  });

  return schema.validate(data);
};

const validateInfoUpdatesData = (data) => {
  const schema = Joi.object({
    clientId: Joi.string().min(24).max(24),
    initiativeId: Joi.string().min(24).max(24),
    name: Joi.string(),
    description: Joi.string(),
  });

  return schema.validate(data);
};

module.exports = { validateInfoData, validateQuestionData, validateInfoUpdatesData };
