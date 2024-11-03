const httpError = require('http-errors');

const surveyService = require('../services/survey.service');

const {
  validateInfoData,
  validateQuestionData,
  validateInfoUpdatesData,
} = require('../helpers/validators/survey.validators');

const createSurvey = async (req, res) => {
  const { error } = validateInfoData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const survey = await surveyService.createSurvey(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Survey created successfully',
    data: survey,
  });
};

const addQuestion = async (req, res) => {
  const { error } = validateQuestionData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const survey = await surveyService.addQuestion(req.params.surveyId, req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Question added successfully',
    data: survey,
  });
};

const updateQuestionDetails = async (req, res) => {
  const { error } = validateQuestionData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const survey = await surveyService.updateQuestionDetails({
    surveyId: req.params.surveyId,
    questionId: req.params.questionId,
    questionData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Question details updated successfully',
    data: survey,
  });
};

const deleteQuestion = async (req, res) => {
  const survey = await surveyService.deleteQuestion(req.params.surveyId, req.params.questionId);

  return res.status(200).send({
    status: 'success',
    message: 'Question deleted successfully',
    data: survey,
  });
};

const getSurveys = async (req, res) => {
  const { surveys, totalCount } = await surveyService.getSurveys(req.user, req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Surveys retrieved successfully',
    totalCount,
    data: surveys,
  });
};

const getSurveyDetails = async (req, res) => {
  const survey = await surveyService.getSurveyDetails(req.params.surveyId);

  return res.status(200).send({
    status: 'success',
    message: 'Survey details retrieved successfully',
    data: survey,
  });
};

const updateSurveyDetails = async (req, res) => {
  const { error } = validateInfoUpdatesData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const survey = await surveyService.updateSurveyDetails(req.params.surveyId, req.body);

  return res.status(200).send({
    status: 'success',
    message: 'Survey details updated successfully',
    data: survey,
  });
};

const updateActiveStatus = async (req, res) => {
  const survey = await surveyService.updateActiveStatus(req.params.surveyId);

  return res.status(200).send({
    status: 'success',
    message: 'Active status updated successfully',
    data: survey,
  });
};

const deleteSurvey = async (req, res) => {
  await surveyService.deleteSurvey(req.params.surveyId);

  return res.status(200).send({
    status: 'success',
    message: 'Survey deleted successfully',
  });
};

module.exports = {
  createSurvey,
  addQuestion,
  updateQuestionDetails,
  deleteQuestion,
  getSurveys,
  getSurveyDetails,
  updateSurveyDetails,
  updateActiveStatus,
  deleteSurvey,
};
