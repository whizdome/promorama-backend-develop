const Joi = require('joi');
const httpError = require('http-errors');

const surveyResponseService = require('../services/surveyResponse.service');
const { sendExcelFile } = require('../helpers/excel');

const validateSurveyResponseData = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().min(24).max(24).required(),
    location: Joi.object({
      latitude: Joi.number().options({ convert: false }).required(),
      longitude: Joi.number().options({ convert: false }).required(),
    }).required(),
    entries: Joi.array()
      .items({
        questionIndex: Joi.number().options({ convert: false }).min(0).required(),
        answer: Joi.string().required(),
      })
      .min(1)
      .required(),
  });

  return schema.validate(data);
};

const createSurveyResponse = async (req, res) => {
  const { error } = validateSurveyResponseData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const surveyResponse = await surveyResponseService.createSurveyResponse(req.user, req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Survey response created successfully',
    data: surveyResponse,
  });
};

const getSurveyResponses = async (req, res) => {
  const { surveyResponses, totalCount } = await surveyResponseService.getSurveyResponses(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Survey responses retrieved successfully',
    totalCount,
    data: surveyResponses,
  });
};

const getSurveyResponsesInExcel = async (req, res) => {
  const { error } = Joi.object({
    surveyId: Joi.string().required(),
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await surveyResponseService.getSurveyResponsesInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'survey_responses.xlsx' });
};

const getSurveyResponseDetails = async (req, res) => {
  const surveyResponse = await surveyResponseService.getSurveyResponseDetails(
    req.params.surveyResponseId,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Survey response details retrieved successfully',
    data: surveyResponse,
  });
};

const updateSurveyResponseDetails = async (req, res) => {
  const { error } = validateSurveyResponseData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const surveyResponse = await surveyResponseService.updateSurveyResponseDetails({
    currentUser: req.user,
    surveyResponseId: req.params.surveyResponseId,
    surveyResponseData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Survey response updated successfully',
    data: surveyResponse,
  });
};

const deleteSurveyResponse = async (req, res) => {
  await surveyResponseService.deleteSurveyResponse(req.user, req.params.surveyResponseId);

  return res.status(200).send({
    status: 'success',
    message: 'Survey response deleted successfully',
  });
};

module.exports = {
  createSurveyResponse,
  getSurveyResponses,
  getSurveyResponsesInExcel,
  getSurveyResponseDetails,
  updateSurveyResponseDetails,
  deleteSurveyResponse,
};
