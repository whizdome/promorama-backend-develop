const httpError = require('http-errors');

const Initiative = require('../models/initiative.model');
const Report = require('../models/report.model');

const APIFeatures = require('../utils/apiFeatures');
const { EXCEL_MAX_DOWNLOAD_RANGE } = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const addReport = async (data) => {
  const { initiativeId, currentUser, ...reportData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');
  if (initiative.isDeleted) throw new httpError.BadRequest('Initiative has been marked as deleted');

  reportData.initiative = initiative.id;
  reportData.date = reportData.date.slice(0, 10);

  return Report.create({
    user: currentUser.id,
    ...reportData,
  });
};

const getAllReports = async (reqQuery) => {
  const apiFeatures = new APIFeatures(Report.find({}), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({ path: 'user', select: 'firstName lastName email phoneNumber profilePicture role' });

  const reports = await apiFeatures.query;
  const totalCount = await Report.countDocuments({
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { reports, totalCount };
};

const getReportsInExcel = async (reqQuery) => {
  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Report.find({}), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const reports = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({ path: 'user', select: 'firstName lastName role' });

  return reports.map((report) => ({
    Date: report.date,
    Name: report.name,
    Comment: report.comment,
    'Report URLs': report.uploadURLs.join(','),
    Creator: `${report.user?.firstName || ''} ${report.user?.lastName || ''}`,
  }));
};

const updateReportDetails = async (data) => {
  const { reportId, currentUser, changes } = data;

  const report = await Report.findById(reportId);
  if (!report) throw new httpError.NotFound('Report not found');

  if (report.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this report');
  }

  changes.date = changes.date.slice(0, 10);
  return Report.updateOne({ _id: reportId }, changes);
};

const deleteReport = async (data) => {
  const { reportId, currentUser } = data;

  const report = await Report.findById(reportId);
  if (!report) throw new httpError.NotFound('Report not found');

  if (report.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this report');
  }

  return Report.deleteOne({ _id: reportId });
};

module.exports = {
  addReport,
  getAllReports,
  getReportsInExcel,
  updateReportDetails,
  deleteReport,
};
