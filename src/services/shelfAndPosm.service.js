const httpError = require('http-errors');

const InitiativeStore = require('../models/initiativeStore.model');
const ShelfAndPosm = require('../models/shelfAndPosm.model');

const APIFeatures = require('../utils/apiFeatures');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { processFilterGroupings } = require('../helpers/proccessFilterGroupings');

const addNewData = async (data) => {
  const { initiativeStoreId, currentUser, reqBody } = data;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId);
  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  return ShelfAndPosm.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    ...reqBody,
  });
};

const getShelfAndPosmDocs = async (reqQuery) => {
  const { initiative } = reqQuery;

  let filter = {};
  if (initiative) filter = await processFilterGroupings({ ...reqQuery, initiativeId: initiative });

  const apiFeatures = new APIFeatures(ShelfAndPosm.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: {
        path: 'store',
        select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
      },
    })
    .populate({ path: 'user', select: 'firstName lastName email phoneNumber profilePicture role' });

  const docs = await apiFeatures.query;
  const totalCount = await ShelfAndPosm.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { docs, totalCount };
};

const updateDoc = async (data) => {
  const { docId, currentUser, changes } = data;

  const doc = await ShelfAndPosm.findById(docId);
  if (!doc) throw new httpError.NotFound('Document not found');

  if (doc.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this document');
  }

  return ShelfAndPosm.updateOne({ _id: docId }, changes);
};

const deleteDoc = async (data) => {
  const { docId, currentUser } = data;

  const doc = await ShelfAndPosm.findById(docId);
  if (!doc) throw new httpError.NotFound('Document not found');

  if (doc.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this document');
  }

  return ShelfAndPosm.deleteOne({ _id: docId });
};

module.exports = {
  addNewData,
  getShelfAndPosmDocs,
  updateDoc,
  deleteDoc,
};
