const httpError = require('http-errors');

const StoreCategory = require('../models/storeCategory.model');

const createStoreCategory = (data) => {
  return StoreCategory.create(data);
};

const getStoreCategories = () => {
  return StoreCategory.find({});
};

const getStoreCategoryDetails = (categoryId) => {
  return StoreCategory.findById(categoryId);
};

const updateStoreCategory = (data) => {
  const { categoryId, changes } = data;
  return StoreCategory.findByIdAndUpdate(categoryId, changes, { new: true });
};

const updateSelectionStatus = async (categoryId) => {
  const storeCategory = await StoreCategory.findById(categoryId);
  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  storeCategory.isSelectable = !storeCategory.isSelectable;
  return storeCategory.save();
};

const deleteStoreCategory = (categoryId) => {
  return StoreCategory.findByIdAndDelete(categoryId);
};

const addType = async (data) => {
  const { categoryId, reqBody } = data;

  const storeCategory = await StoreCategory.findById(categoryId);
  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  const existingType = await StoreCategory.findOne({ _id: categoryId, 'types.name': reqBody.name });
  if (existingType) throw new httpError.BadRequest(`Type already exists`);

  storeCategory.types.push(reqBody);
  return storeCategory.save();
};

const updateTypeDetails = async (data) => {
  const { categoryId, typeId, changes } = data;

  const storeCategory = await StoreCategory.findById(categoryId);
  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  const doc = await StoreCategory.findOne(
    { _id: categoryId, 'types.name': changes.name },
    { 'types.$': 1 },
  );

  if (doc && doc.types[0]._id.toString() !== typeId) {
    throw new httpError.BadRequest(`Type already exists`);
  }

  return StoreCategory.findOneAndUpdate(
    { _id: categoryId, 'types._id': typeId },
    {
      $set: {
        'types.$.name': changes.name,
        'types.$.levels': changes.levels,
      },
    },
    { new: true },
  );
};

const deleteType = async (data) => {
  const { categoryId, typeId } = data;

  const storeCategory = await StoreCategory.findById(categoryId);
  if (!storeCategory) throw new httpError.NotFound('Store category not found');

  storeCategory.types.pull(typeId);
  return storeCategory.save();
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
