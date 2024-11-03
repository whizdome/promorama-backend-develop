const httpError = require('http-errors');

const InitiativeStore = require('../models/initiativeStore.model');
const InitiativeStoresReport = require('../models/initiativeStoresReport.model');

const APIFeatures = require('../utils/apiFeatures');
const { EXCEL_MAX_DOWNLOAD_RANGE, ROLE } = require('../helpers/constants');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const createReport = async (data) => {
  const { initiativeStoreId, currentUser, reportData } = data;
  reportData.date = reportData.date.slice(0, 10);

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId);
  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  const existingReport = await InitiativeStoresReport.findOne({
    initiativeStore: initiativeStoreId,
    date: reportData.date,
  });

  if (existingReport) {
    throw new httpError.BadRequest(`A report has already been created`);
  }

  await InitiativeStoresReport.create({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStore._id,
    user: currentUser.id,
    ...reportData,
  });
};

const getReports = async (reqQuery) => {
  const apiFeatures = new APIFeatures(InitiativeStoresReport.find({}), reqQuery)
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

  const reports = await apiFeatures.query;
  const totalCount = await InitiativeStoresReport.countDocuments({
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

  const apiFeatures = new APIFeatures(InitiativeStoresReport.find({}), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const reports = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return reports.map((report) => ({
    Date: report.date,
    'Store Name': report.initiativeStore?.store?.name,
    LGA: report.initiativeStore?.store?.area,
    State: report.initiativeStore?.store?.state,
    Creator: `${report.user?.firstName || ''} ${report.user?.lastName || ''}`,
    'Creator Role': report.user?.role,
    'Store Management Text': report.storeManagement.text,
    'Store Management Image URL': report.storeManagement.imageURL,
    'Personnel Attendance Text': report.personnelAttendance.text,
    'Personnel Attendance Image URL': report.personnelAttendance.imageURL,
    'Personnel Knowledge Text': report.personnelKnowledge.text,
    'Personnel Knowledge Image URL': report.personnelKnowledge.imageURL,
    'Sales Text': report.sales.text,
    'Sales Image URL': report.sales.imageURL,
    'Must Stock List Text': report.mustStockList.text,
    'Must Stock List Image URL': report.mustStockList.imageURL,
    'Share of Shelf Text': report.shareOfShelf.text,
    'Share of Shelf Image URL': report.shareOfShelf.imageURL,
    'Out of Stock Text': report.outOfStock.text,
    'Out of Stock Image URL': report.outOfStock.imageURL,
    'Low Stock Text': report.lowStock.text,
    'Low Stock Image URL': report.lowStock.imageURL,
    'Orders Text': report.orders.text,
    'Orders Image URL': report.orders.imageURL,
    'Shipment and Delivery Text': report.shipmentAndDelivery.text,
    'Shipment and Delivery Image URL': report.shipmentAndDelivery.imageURL,
    'Payments Text': report.payments.text,
    'Payments Image URL': report.payments.imageURL,
    'POSM Text': report.posm.text,
    'POSM Image URL': report.posm.imageURL,
    'Shelf Text': report.shelf.text,
    'Shelf Image URL': report.shelf.imageURL,
    'Product Expiry Text': report.productExpiry.text,
    'Product Expiry Image URL': report.productExpiry.imageURL,
    'Product Issues Text': report.productIssues.text,
    'Product Issues Image URL': report.productIssues.imageURL,
    'Competition Text': report.competition.text,
    'Competition Image URL': report.competition.imageURL,
    'Pricing Text': report.pricing.text,
    'Pricing Image URL': report.pricing.imageURL,
    'In Store Activity Text': report.inStoreActivity.text,
    'In Store Activity Image URL': report.inStoreActivity.imageURL,
    'Others Text': report.others.text,
    'Others Image URL': report.others.imageURL,
  }));
};

const updateReportDetails = async (data) => {
  const { reportId, currentUser, changes } = data;
  changes.date = changes.date.slice(0, 10);

  const report = await InitiativeStoresReport.findById(reportId);
  if (!report) throw new httpError.NotFound('Report not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && report.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to update this report');
  }

  const existingReport = await InitiativeStoresReport.findOne({
    _id: { $ne: reportId },
    initiativeStore: report.initiativeStore,
    date: changes.date,
  });

  if (existingReport) {
    throw new httpError.BadRequest(`A report has already been created`);
  }

  await InitiativeStoresReport.updateOne({ _id: reportId }, changes);
};

const deleteReport = async (data) => {
  const { reportId, currentUser } = data;

  const report = await InitiativeStoresReport.findById(reportId);
  if (!report) throw new httpError.NotFound('Report not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && report.user.toString() !== currentUser.id) {
    throw new httpError.Forbidden('You are not allowed to delete this report');
  }

  await InitiativeStoresReport.deleteOne({ _id: reportId });
};

module.exports = {
  createReport,
  getReports,
  getReportsInExcel,
  updateReportDetails,
  deleteReport,
};
