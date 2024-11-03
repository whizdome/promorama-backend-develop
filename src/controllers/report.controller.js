const Joi = require('joi');
const httpError = require('http-errors');

const reportService = require('../services/report.service');
const { sendExcelFile } = require('../helpers/excel');

const validateReportData = (data) => {
  const schema = Joi.object({
    initiativeId: Joi.string().required(),
    date: Joi.date().iso().required(),
    name: Joi.string().required(),
    comment: Joi.string().required(),
    uploadURLs: Joi.array().items(Joi.string()).min(1).required(),
  });

  return schema.validate(data);
};

const addReport = async (req, res) => {
  const { error } = validateReportData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await reportService.addReport({
    currentUser: req.user,
    ...req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Report added successfully',
  });
};

const getAllReports = async (req, res) => {
  const { reports, totalCount } = await reportService.getAllReports(req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Reports retrieved successfully',
    totalCount,
    data: reports,
  });
};

const getReportsInExcel = async (req, res) => {
  const { error } = Joi.object({
    startRange: Joi.number().min(1).required(),
    endRange: Joi.number().min(1).required(),
  }).validate(req.query, { allowUnknown: true });

  if (error) throw new httpError.BadRequest(error.message);

  const excelData = await reportService.getReportsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'reports.xlsx' });
};

const updateReportDetails = async (req, res) => {
  const { error } = validateReportData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await reportService.updateReportDetails({
    reportId: req.params.reportId,
    currentUser: req.user,
    changes: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Report updated successfully',
  });
};

const deleteReport = async (req, res) => {
  await reportService.deleteReport({
    reportId: req.params.reportId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Report deleted successfully',
  });
};

module.exports = {
  addReport,
  getAllReports,
  getReportsInExcel,
  updateReportDetails,
  deleteReport,
};
