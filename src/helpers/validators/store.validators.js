const Joi = require('joi');

/** Validates store data */
const validateStoreData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string(),
    streetNumber: Joi.string().required(),
    streetName: Joi.string().required(),
    state: Joi.string().required(),
    area: Joi.string().required(),
    town: Joi.string(),
    country: Joi.string(),
    ownerFirstName: Joi.string(),
    ownerLastName: Joi.string(),
    ownerPhoneNumber: Joi.string(),
    ownerEmail: Joi.string().email(),
    type: Joi.string().required(),
    level: Joi.string().required(),
    category: Joi.string().required(),
    imageURL: Joi.string().required(),
    brand: Joi.string(),
    additionalInfo: Joi.string(),
    coordinates: Joi.object({
      latitude: Joi.number().options({ convert: false }).required(),
      longitude: Joi.number().options({ convert: false }).required(),
    }).required(),
    clientId: Joi.string().min(24).max(24),
    team: Joi.string().required(),
  }).and('ownerFirstName', 'ownerLastName');

  return schema.validate(data);
};

/** Validates store update data */
const validateStoreUpdateData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string(),
    streetNumber: Joi.string(),
    streetName: Joi.string(),
    state: Joi.string().required(),
    area: Joi.string().required(),
    town: Joi.string(),
    country: Joi.string(),
    ownerFirstName: Joi.string(),
    ownerLastName: Joi.string(),
    ownerPhoneNumber: Joi.string(),
    ownerEmail: Joi.string().email(),
    type: Joi.string().required(),
    level: Joi.string().required(),
    category: Joi.string().required(),
    imageURL: Joi.string().required(),
    brand: Joi.string(),
    additionalInfo: Joi.string(),
    team: Joi.string(),
  });

  return schema.validate(data);
};

module.exports = { validateStoreData, validateStoreUpdateData };
