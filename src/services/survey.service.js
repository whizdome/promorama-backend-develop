const httpError = require('http-errors');

const Client = require('../models/client.model');
const Initiative = require('../models/initiative.model');
const Survey = require('../models/survey.model');

const APIFeatures = require('../utils/apiFeatures');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { ROLE } = require('../helpers/constants');

const createSurvey = async (surveyData) => {
  const { clientId, initiativeId } = surveyData;

  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');
  if (!client.isApproved) throw new httpError.BadRequest('Client not approved');
  if (client.isDeleted) throw new httpError.BadRequest('Client has been marked as deleted');

  let data = { ...surveyData, client: client._id };

  if (initiativeId) {
    const initiative = await Initiative.findById(initiativeId);
    if (!initiative) throw new httpError.NotFound('Initiative not found');
    if (initiative.isDeleted) {
      throw new httpError.BadRequest('Initiative has been marked as deleted');
    }

    data = { ...data, initiative: initiative._id };
  }

  const survey = await Survey.create(data);

  return survey;
};

const addQuestion = async (surveyId, questionData) => {
  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');

  survey.questions.push(questionData);
  await survey.save();

  return survey;
};

const updateQuestionDetails = async (data) => {
  const { surveyId, questionId, questionData } = data;

  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');

  const updatedSurvey = await Survey.findOneAndUpdate(
    { _id: surveyId, 'questions._id': questionId },
    {
      $set: {
        'questions.$.title': questionData.title,
        'questions.$.fieldName': questionData.fieldName,
        'questions.$.fieldType': questionData.fieldType,
        'questions.$.fieldOptions': questionData.fieldOptions,
        'questions.$.isRequired': questionData.isRequired,
      },
    },
    { new: true },
  );

  if (!updatedSurvey) throw new httpError.NotFound('Question not found');

  return updatedSurvey;
};

const deleteQuestion = async (surveyId, questionId) => {
  const survey = await Survey.findByIdAndUpdate(
    surveyId,
    { $pull: { questions: { _id: questionId } } },
    { new: true },
  );

  if (!survey) throw new httpError.NotFound('Survey not found');

  return survey;
};

const getSurveys = async (currentUser, reqQuery) => {
  const filter = { initiative: null };
  if (currentUser.role === ROLE.CLIENT) filter.client = currentUser.id;

  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);
    filter.$or = [
      { name: { $regex: sanitizedTerm, $options: 'i' } },
      { description: { $regex: sanitizedTerm, $options: 'i' } },
    ];
  }

  const apiFeatures = new APIFeatures(Survey.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'client',
      select: 'companyName email phoneNumber profilePicture',
    });

  const surveys = await apiFeatures.query;
  const totalCount = await Survey.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { surveys, totalCount };
};

const getSurveyDetails = async (surveyId) => {
  const survey = await Survey.findById(surveyId).populate({
    path: 'client',
    select: 'companyName email phoneNumber profilePicture',
  });

  if (!survey) throw new httpError.NotFound('Survey not found');

  return survey;
};

const updateSurveyDetails = async (surveyId, surveyData) => {
  const { clientId, initiativeId } = surveyData;

  let changes = { ...surveyData };

  if (clientId) {
    const client = await Client.findById(clientId);
    if (!client) throw new httpError.NotFound('Client not found');
    if (!client.isApproved) throw new httpError.BadRequest('Client not approved');
    if (client.isDeleted) throw new httpError.BadRequest('Client has been marked as deleted');

    changes = { ...changes, client: client._id };
  }

  if (initiativeId) {
    const initiative = await Initiative.findById(initiativeId);
    if (!initiative) throw new httpError.NotFound('Initiative not found');
    if (initiative.isDeleted) {
      throw new httpError.BadRequest('Initiative has been marked as deleted');
    }

    changes = { ...changes, initiative: initiative._id };
  }

  const survey = await Survey.findByIdAndUpdate(surveyId, changes, { new: true });
  if (!survey) throw new httpError.NotFound('Survey not found');

  return survey;
};

const updateActiveStatus = async (surveyId) => {
  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');

  survey.isActive = !survey.isActive;
  await survey.save();

  return survey;
};

const deleteSurvey = async (surveyId) => {
  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');

  await survey.deleteOne();
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
