/* eslint-disable no-param-reassign */
const Joi = require('joi');
const httpError = require('http-errors');

const messageService = require('../services/message.service');
const { MODEL_NAME } = require('../helpers/constants');
const { sendExcelFile } = require('../helpers/excel');

const createMessage = async (req, res) => {
  const { error } = Joi.object({
    initiativeStoreId: Joi.string().min(24).max(24).required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    imageURL: Joi.string(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await messageService.createMessage({ currentUser: req.user, messageData: req.body });

  return res.status(201).send({
    status: 'success',
    message: 'Message created successfully',
  });
};

const getMessageTitleOptions = async (req, res) => {
  return res.status(200).send({
    status: 'success',
    message: 'Message title options retrieved successfully',
    data: [
      'Out of Stock',
      'Low Stock',
      'Payment',
      'Orders',
      'Expiry Dates',
      'Incomplete Delivery',
      'Damaged POSM',
      'POSM Review',
      'Unpaid Shelf and Gondola Fees',
      'Store Owner/Management',
      'Promotion/Initiative ',
      'Others',
    ],
  });
};

const getMessages = async (req, res) => {
  const { messages, totalCount } = await messageService.getMessages(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Messages retrieved successfully',
    totalCount,
    data: messages,
  });
};

const getMessageDetails = async (req, res) => {
  const message = await messageService.getMessageDetails(req.params.messageId);

  return res.status(200).send({
    status: 'success',
    message: 'Message details retrieved successfully',
    data: message,
  });
};

const getMessagesInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await messageService.getMessagesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'messages.xlsx', resourceType: MODEL_NAME.MESSAGE });
};

const respondToMessage = async (req, res) => {
  const { error } = Joi.object({
    text: Joi.string().required(),
    imageURL: Joi.string(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await messageService.respondToMessage({
    messageId: req.params.messageId,
    currentUser: req.user,
    responseData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Message response sent successfully',
  });
};

const toggleResolveStatus = async (req, res) => {
  await messageService.toggleResolveStatus(req.params.messageId);

  return res.status(200).send({
    status: 'success',
    message: 'Resolve status updated successfully',
  });
};

const deleteMessage = async (req, res) => {
  await messageService.deleteMessage({
    messageId: req.params.messageId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Message deleted successfully',
  });
};

const sendClientInitiativesMessages = async (req, res) => {
  const { error } = Joi.object({
    clientID: Joi.string().min(24).max(24).required(),
    isResolved: Joi.boolean().options({ convert: false }),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  await messageService.sendClientInitiativesMessages(req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Initiative(s) messages report sent to client successfully',
  });
};

module.exports = {
  createMessage,
  getMessageTitleOptions,
  getMessages,
  getMessageDetails,
  getMessagesInExcel,
  respondToMessage,
  toggleResolveStatus,
  deleteMessage,
  sendClientInitiativesMessages,
};
