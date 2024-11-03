const httpError = require('http-errors');

const Survey = require('../models/survey.model');
const SurveyResponse = require('../models/surveyResponse.model');

const APIFeatures = require('../utils/apiFeatures');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const { ROLE } = require('../helpers/constants');

// const groupSurveyResponsesForExcel = (survey, surveyResponses) => {
//   // Map questions field name to default empty values
//   const responseFormat = {};
//   for (const question of survey.questions) {
//     responseFormat[question.fieldName] = '';
//   }

//   const excelData = [];
//   for (const response of surveyResponses) {
//     const { entries } = response;

//     for (const entry of entries) {
//       const { fieldName } = survey.questions[entry.questionIndex];
//       responseFormat[fieldName] = entry.answer;
//     }

//     // create a new responseFormat object for each survey response, ensuring that each entry in the excelData array is a separate object
//     excelData.push({ ...responseFormat });
//   }

//   return excelData;
// };

/**
 *  The time complexity remains O(n⋅m) because each survey response must be processed in relation to each question, which is unavoidable given the nature of the task. However, the code is cleaner and more maintainable. If performance becomes a concern due to a large number of survey responses or questions, consider profiling the function to identify bottlenecks. For extremely large datasets, you might look into more advanced optimizations or processing the data in chunks asynchronously.
 * @param {*} survey
 * @param {*} surveyResponses
 */

const groupSurveyResponsesForExcel = (survey, surveyResponses) => {
  // Map questions field name to default empty values
  const defaultResponseFormat = survey.questions.reduce((acc, question) => {
    acc[question.fieldName] = '';
    return acc;
  }, {});

  const excelData = surveyResponses.map((response) => {
    // Create a new responseFormat object for each survey response, ensuring that each entry in the excelData array is a separate object
    const responseFormat = { ...defaultResponseFormat };

    response.entries.forEach((entry) => {
      const { fieldName } = survey.questions[entry.questionIndex];
      responseFormat[fieldName] = entry.answer;
    });

    responseFormat.Location = `https://www.google.com/maps?q=${response.location.coordinates[1]},${response.location.coordinates[0]}`;
    responseFormat.Creator = `${response.user?.firstName} ${response.user?.lastName}`;

    return responseFormat;
  });

  return excelData;
};

const createSurveyResponse = async (currentUser, surveyResponseData) => {
  const { surveyId, location, entries } = surveyResponseData;

  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');
  if (!survey.isActive) throw new httpError.BadRequest('Survey is no longer active');

  const surveyResponse = await SurveyResponse.create({
    user: currentUser.id,
    survey: surveyId,
    location: { type: 'Point', coordinates: [location.longitude, location.latitude] },
    entries,
  });

  return surveyResponse;
};

const getSurveyResponses = async (reqQuery) => {
  const apiFeatures = new APIFeatures(SurveyResponse.find({}), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({ path: 'survey' })
    .populate({ path: 'user', select: 'firstName lastName email phoneNumber profilePicture role' });

  const surveyResponses = await apiFeatures.query;
  const totalCount = await SurveyResponse.countDocuments({
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { surveyResponses, totalCount };
};

const getSurveyResponsesInExcel = async (reqQuery) => {
  const { surveyId, startRange, endRange, ...queryString } = reqQuery;

  const EXCEL_MAX_DOWNLOAD_RANGE = 10_000;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');

  const apiFeatures = new APIFeatures(SurveyResponse.find({ survey: surveyId }), queryString)
    .filter()
    .sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const surveyResponses = await apiFeatures.query.skip(skip).limit(limit).populate({
    path: 'user',
    select: 'firstName lastName role',
  });

  if (!surveyResponses.length) {
    throw new httpError.UnprocessableEntity('No responses to export for this survey');
  }

  return groupSurveyResponsesForExcel(survey, surveyResponses);
};

const getSurveyResponseDetails = async (surveyResponseId) => {
  const surveyResponse = await SurveyResponse.findById(surveyResponseId)
    .populate({ path: 'survey' })
    .populate({ path: 'user', select: 'firstName lastName email phoneNumber profilePicture role' });

  if (!surveyResponse) throw new httpError.NotFound('Survey response not found');

  return surveyResponse;
};

const updateSurveyResponseDetails = async (data) => {
  const { currentUser, surveyResponseId, surveyResponseData } = data;
  const { surveyId, location, entries } = surveyResponseData;

  const surveyResponse = await SurveyResponse.findById(surveyResponseId);
  if (!surveyResponse) throw new httpError.NotFound('Survey response not found');

  if (currentUser.role === ROLE.PROMOTER && surveyResponse.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this survey response');
  }

  const survey = await Survey.findById(surveyId);
  if (!survey) throw new httpError.NotFound('Survey not found');
  if (!survey.isActive) throw new httpError.BadRequest('Survey is no longer active');

  const changes = {
    survey: surveyId,
    location: { type: 'Point', coordinates: [location.longitude, location.latitude] },
    entries,
  };

  const updatedSurveyResponse = await SurveyResponse.findByIdAndUpdate(surveyResponseId, changes, {
    new: true,
  });

  if (!updatedSurveyResponse) throw new httpError.NotFound('Survey response not found');

  return updatedSurveyResponse;
};

const deleteSurveyResponse = async (currentUser, surveyResponseId) => {
  const surveyResponse = await SurveyResponse.findById(surveyResponseId);
  if (!surveyResponse) throw new httpError.NotFound('Survey response not found');

  if (currentUser.role === ROLE.PROMOTER && surveyResponse.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this survey response');
  }

  await SurveyResponse.deleteOne({ _id: surveyResponseId });
};

module.exports = {
  createSurveyResponse,
  getSurveyResponses,
  getSurveyResponsesInExcel,
  getSurveyResponseDetails,
  updateSurveyResponseDetails,
  deleteSurveyResponse,
};
