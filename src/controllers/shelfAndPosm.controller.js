const Joi = require('joi');
const httpError = require('http-errors');

const shelfAndPosmService = require('../services/shelfAndPosm.service');

const validateData = (data) => {
  const schema = Joi.object({
    type: Joi.string().valid('shelf', 'posm').required(),
    imageURL: Joi.string().required(),
    comment: Joi.string(),
    state: Joi.string().required(),
  });

  return schema.validate(data);
};

const addNewData = async (req, res) => {
  const { error } = validateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await shelfAndPosmService.addNewData({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reqBody: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Data added successfully',
  });
};

const getShelfAndPosmDocs = async (req, res) => {
  const { docs, totalCount } = await shelfAndPosmService.getShelfAndPosmDocs(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Documents retrieved successfully',
    totalCount,
    data: docs,
  });
};

const updateDoc = async (req, res) => {
  const { error } = validateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await shelfAndPosmService.updateDoc({
    docId: req.params.docId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Document updated successfully',
  });
};

const deleteDoc = async (req, res) => {
  await shelfAndPosmService.deleteDoc({
    docId: req.params.docId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Document deleted successfully',
  });
};

module.exports = {
  addNewData,
  getShelfAndPosmDocs,
  updateDoc,
  deleteDoc,
};
