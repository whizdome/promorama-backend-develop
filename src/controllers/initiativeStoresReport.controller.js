const Joi = require('joi');
const httpError = require('http-errors');

const initiativeStoresReportService = require('../services/initiativeStoresReport.service');
const { sendExcelFile } = require('../helpers/excel');

const validateReportData = (data) => {
  const valueObject = Joi.object({ text: Joi.string().required(), imageURL: Joi.string() });

  const schema = Joi.object({
    date: Joi.date().iso().required(),
    storeManagement: valueObject,
    personnelAttendance: valueObject,
    personnelKnowledge: valueObject,
    sales: valueObject,
    mustStockList: valueObject,
    shareOfShelf: valueObject,
    outOfStock: valueObject,
    lowStock: valueObject,
    orders: valueObject,
    shipmentAndDelivery: valueObject,
    payments: valueObject,
    posm: valueObject,
    shelf: valueObject,
    productExpiry: valueObject,
    productIssues: valueObject,
    competition: valueObject,
    pricing: valueObject,
    inStoreActivity: valueObject,
    others: valueObject,
  }).min(2);

  return schema.validate(data);
};

const createReport = async (req, res) => {
  const { error } = validateReportData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoresReportService.createReport({
    initiativeStoreId: req.params.initiativeStoreId,
    currentUser: req.user,
    reportData: req.body,
  });

  return res.status(201).send({
    status: 'success',
    message: 'Report created successfully',
  });
};

const getReports = async (req, res) => {
  const { reports, totalCount } = await initiativeStoresReportService.getReports(req.query);

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

  const excelData = await initiativeStoresReportService.getReportsInExcel(req.query);

  sendExcelFile(res, excelData, { fileName: 'initiative_stores_reports.xlsx' });
};

const updateReportDetails = async (req, res) => {
  const { error } = validateReportData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeStoresReportService.updateReportDetails({
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
  await initiativeStoresReportService.deleteReport({
    reportId: req.params.reportId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Report deleted successfully',
  });
};

module.exports = {
  createReport,
  getReports,
  getReportsInExcel,
  updateReportDetails,
  deleteReport,
};
