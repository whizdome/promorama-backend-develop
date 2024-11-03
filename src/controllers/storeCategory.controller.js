const Joi = require('joi');
const httpError = require('http-errors');

const storeCategoryService = require('../services/storeCategory.service');

const validateStoreCategoryData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    types: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          levels: Joi.array().items(Joi.string()).min(1).required(),
        }),
      )
      .min(1),
  });

  return schema.validate(data);
};

const validateStoreCategoryTypeData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    levels: Joi.array().items(Joi.string()).min(1).required(),
  });

  return schema.validate(data);
};

const createStoreCategory = async (req, res) => {
  const { error } = validateStoreCategoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const storeCategory = await storeCategoryService.createStoreCategory(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Store category created successfully',
    data: storeCategory,
  });
};

const getStoreCategories = async (req, res) => {
  const storeCategories = await storeCategoryService.getStoreCategories();

  res.status(200).send({
    status: 'success',
    message: 'Store categories retrieved successfully',
    data: storeCategories,
  });
};

const getStoreCategoryDetails = async (req, res) => {
  const storeCategory = await storeCategoryService.getStoreCategoryDetails(req.params.categoryId);
  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  res.status(200).send({
    status: 'success',
    message: 'Store category details retrieved successfully',
    data: storeCategory,
  });
};

const updateStoreCategory = async (req, res) => {
  const { error } = validateStoreCategoryData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const storeCategory = await storeCategoryService.updateStoreCategory({
    categoryId: req.params.categoryId,
    changes: req.body,
  });

  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  return res.status(200).send({
    status: 'success',
    message: 'Store category updated successfully',
    data: storeCategory,
  });
};

const updateSelectionStatus = async (req, res) => {
  const storeCategory = await storeCategoryService.updateSelectionStatus(req.params.categoryId);

  return res.status(200).send({
    status: 'success',
    message: 'Selection status updated successfully',
    data: storeCategory,
  });
};

const deleteStoreCategory = async (req, res) => {
  const storeCategory = await storeCategoryService.deleteStoreCategory(req.params.categoryId);
  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  res.status(200).send({
    status: 'success',
    message: 'Store category deleted successfully',
  });
};

const addType = async (req, res) => {
  const { error } = validateStoreCategoryTypeData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const storeCategory = await storeCategoryService.addType({
    categoryId: req.params.categoryId,
    reqBody: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Type added successfully',
    data: storeCategory,
  });
};

const updateTypeDetails = async (req, res) => {
  const { error } = validateStoreCategoryTypeData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const storeCategory = await storeCategoryService.updateTypeDetails({
    categoryId: req.params.categoryId,
    typeId: req.params.typeId,
    changes: req.body,
  });

  if (!storeCategory) throw new httpError.NotFound('Store category type not found');

  return res.status(200).send({
    status: 'success',
    message: 'Type details updated successfully',
    data: storeCategory,
  });
};

const deleteType = async (req, res) => {
  const storeCategory = await storeCategoryService.deleteType({
    categoryId: req.params.categoryId,
    typeId: req.params.typeId,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Type deleted successfully',
    data: storeCategory,
  });
};

module.exports = {
  createStoreCategory,
  getStoreCategories,
  getStoreCategoryDetails,
  updateStoreCategory,
  updateSelectionStatus,
  deleteStoreCategory,
  addType,
  updateTypeDetails,
  deleteType,
};
