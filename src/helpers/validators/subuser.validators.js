const Joi = require('joi');

const validateSubuserCreationData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
  });

  return schema.validate(data);
};

const validateSubuserUpdateData = (data) => {
  const schema = Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    profilePicture: Joi.string(),
  }).min(1);

  return schema.validate(data);
};

module.exports = {
  validateSubuserCreationData,
  validateSubuserUpdateData,
};
