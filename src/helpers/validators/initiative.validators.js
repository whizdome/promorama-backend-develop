const Joi = require('joi');

const validateInitiativeMechanicsData = (data) => {
  const schema = Joi.object({
    clientId: Joi.string().min(24).max(24).required(),
    agencyId: Joi.string().min(24).max(24),
    name: Joi.string().required(),
    description: Joi.string().required(),
    instructions: Joi.string().required(),
    imageURL: Joi.string(),
    brands: Joi.array()
      .items({
        name: Joi.string().required(),
        sku: Joi.string().required(),
        image: Joi.string(),
        target: Joi.number().options({ convert: false }).required(),
        durationInDays: Joi.number().options({ convert: false }).required(),
        caseUnitsNumber: Joi.number().min(1).options({ convert: false }).required(),
        pricePerCase: Joi.number().min(0).options({ convert: false }).required(),
      })
      .min(1),
  });

  return schema.validate(data);
};

const validateInitiativeBrandData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    image: Joi.string(),
    target: Joi.number().options({ convert: false }).required(),
    durationInDays: Joi.number().options({ convert: false }).required(),
    caseUnitsNumber: Joi.number().min(1).options({ convert: false }).required(),
    pricePerCase: Joi.number().min(0).options({ convert: false }).required(),
  });

  return schema.validate(data);
};

const validateShelfAndPosmImagesData = (data) => {
  const schema = Joi.object({
    shelfImages: Joi.array().items(Joi.string()).min(1),
    posmImages: Joi.array().items(Joi.string()).min(1),
  }).min(1);

  return schema.validate(data);
};

const validateInitiativeUpdatesData = (data) => {
  const schema = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    instructions: Joi.string(),
    imageURL: Joi.string(),
  }).min(1);

  return schema.validate(data);
};

const validateInitiativeStoreCreationData = (data) => {
  const schema = Joi.object({
    storeId: Joi.string().min(24).max(24).required(),
    promoterId: Joi.string().min(24).max(24).required(),
    supervisorId: Joi.string().min(24).max(24).required(),
    radius: Joi.number().options({ convert: false }),
  });

  return schema.validate(data);
};

const validateInitiativeStoreUpdatesData = (data) => {
  const schema = Joi.object({
    promoterId: Joi.string().min(24).max(24),
    supervisorId: Joi.string().min(24).max(24),
    radius: Joi.number().options({ convert: false }),
  }).min(1);

  return schema.validate(data);
};

const validateInitiativeGameCreationData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    title: Joi.string(),
    imageURL: Joi.string(),
    questions: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().required(),
          answer: Joi.string().required(),
        }),
      )
      .min(1),
  });

  return schema.validate(data);
};

const validateInitiativeGameUpdateData = (data) => {
  const schema = Joi.object({
    title: Joi.string(),
    imageURL: Joi.string(),
    questions: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().required(),
          answer: Joi.string().required(),
        }),
      )
      .min(1),
  }).min(1);

  return schema.validate(data);
};

const validateGamePrizeOptionData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    rank: Joi.number().options({ convert: false }).required(),
  });

  return schema.validate(data);
};

const validateGamePrizeData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    quantityAvailable: Joi.number().options({ convert: false }).required(),
    rank: Joi.number().options({ convert: false }).required(),
  });

  return schema.validate(data);
};

const validateInitiativeCustomBrandData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    imageURL: Joi.string(),
  });

  return schema.validate(data);
};

const validateInitiativeStoresFilterGroupData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    initiativeStoresIDs: Joi.array().items(Joi.string().min(24).max(24)).min(1).required(),
  });

  return schema.validate(data);
};

const validateProductsFilterGroupData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    products: Joi.array().items(Joi.string()).min(1).required(),
  });

  return schema.validate(data);
};

module.exports = {
  validateInitiativeMechanicsData,
  validateInitiativeBrandData,
  validateShelfAndPosmImagesData,
  validateInitiativeUpdatesData,
  validateInitiativeStoreCreationData,
  validateInitiativeStoreUpdatesData,
  validateInitiativeGameCreationData,
  validateInitiativeGameUpdateData,
  validateGamePrizeOptionData,
  validateGamePrizeData,
  validateInitiativeCustomBrandData,
  validateInitiativeStoresFilterGroupData,
  validateProductsFilterGroupData,
};
