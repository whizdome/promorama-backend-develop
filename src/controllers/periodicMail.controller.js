/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
const { StatusCodes } = require('http-status-codes');
const createHttpError = require('http-errors');
const {
  getOngoingInitiative,
  getSalesOfAnInitiative,
  getOverallSold,
  getSalesByInitiativeStore,
  getOverallMsl,
  getProductiveOutlets,
  getOverallStoreInventories,
  groupDataByRegion,
  getClockIns,
  findTop3CommonLevels,
  getInitiativeSubUsers,
  findTop3CommonLevelsForStores,
  getAllMsl,
} = require('../helpers/periodicMail');
const { periodicMailTemplate } = require('../helpers/templates/periodicMail');
const { sendEmail, sendEmailToMultiple } = require('../helpers/email');
const { formatDate } = require('../helpers/formatDate');
const Initiative = require('../models/initiative.model');

const BATCH_SIZE = 10; // Example batch size, adjust based on your system's capacity

const gatherReport = async (start, end, lastReport, beginningOfLastReport, reportType) => {
  try {
    // Fetch ongoing initiatives
    const { msg, status, sanitizedOngoingInitiatives } = await getOngoingInitiative();
    if (!sanitizedOngoingInitiatives) {
      return { msg, status: StatusCodes.BAD_REQUEST };
    }

    const errors = [];

    for (let i = 0; i < sanitizedOngoingInitiatives.length; i += BATCH_SIZE) {
      const batch = sanitizedOngoingInitiatives.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (element) => {
          try {
            const {
              msg: salesHelperMsg,
              status: salesHelperStatus,
              sales,
            } = await getSalesOfAnInitiative(element.initiativeId, start, end);
            const { msg: lastWeekSalesHelperMsg, sales: lastWeekSales } =
              await getSalesOfAnInitiative(element.initiativeId, beginningOfLastReport, lastReport);

            // console.log(sales);
            if (!sales) {
              errors.push({ elementName: element.name, error: salesHelperMsg });
              return;
            }

            if (!lastWeekSales) {
              errors.push({ elementName: element.name, error: lastWeekSalesHelperMsg });
              return;
            }

            const byBrandData = await getOverallSold(sales);
            if (!byBrandData) {
              errors.push({
                elementName: element.name,
                error: 'Unable to generate overall sold data',
              });
              return;
            }

            const lastWeekData = await getOverallSold(lastWeekSales, true);
            if (!lastWeekData) {
              errors.push({
                elementName: element.name,
                error: "Unable to generate last week's overall sold data",
              });
              return;
            }

            const byStoreData = await getSalesByInitiativeStore(sales);
            if (!byStoreData) {
              errors.push({
                elementName: element.name,
                error: 'Unable to generate sold data by stores',
              });
              return;
            }

            const { msg: getAllMslMsg, allMsl } = await getAllMsl(element.initiativeId, start, end);

            if (!allMsl) {
              errors.push({ elementName: element.name, error: getAllMslMsg });
              return;
            }

            const { msg: getAllPrevMslMsg, allMsl: prevAllMsl } = await getAllMsl(
              element.initiativeId,
              beginningOfLastReport,
              lastReport,
            );

            if (!prevAllMsl) {
              errors.push({ elementName: element.name, error: getAllPrevMslMsg });
              return;
            }

            const { msg: mslMsg, overAllMsl } = await getOverallMsl(allMsl);

            const { msg: lastWeekMslMsg, overAllMsl: lastWeekMslOverallMsl } = await getOverallMsl(
              prevAllMsl,
            );

            if (Number.isNaN(overAllMsl)) {
              errors.push({ elementName: element.name, error: mslMsg });
              return;
            }

            if (Number.isNaN(lastWeekMslMsg)) {
              errors.push({ elementName: element.name, error: lastWeekMslMsg });
              return;
            }

            const { msg: productiveOutletMsg, productiveOutlets } = await getProductiveOutlets(
              sales,
            );
            const {
              msg: lastWeekProductiveOutletMsg,
              productiveOutlets: lastWeekProductiveOutlet,
            } = await getProductiveOutlets(lastWeekSales);

            if (Number.isNaN(productiveOutletMsg)) {
              errors.push({ elementName: element.name, error: productiveOutletMsg });
              return;
            }

            if (Number.isNaN(lastWeekMslMsg)) {
              errors.push({
                elementName: element.name,
                error: `${lastWeekProductiveOutletMsg}  - last week`,
              });
              return;
            }

            const { msg: overallStoreInventoriesMsg, overallStoreInventories } =
              await getOverallStoreInventories(element.initiativeId, start, end);
            const {
              msg: lastWeekOverallStoreInventoriesMsg,
              overallStoreInventories: lastWeekOverallStoreInventories,
            } = await getOverallStoreInventories(
              element.initiativeId,
              beginningOfLastReport,
              lastReport,
            );

            if (!overallStoreInventories) {
              errors.push({ elementName: element.name, error: overallStoreInventoriesMsg });
              return;
            }

            if (!lastWeekOverallStoreInventories) {
              errors.push({ elementName: element.name, error: lastWeekOverallStoreInventoriesMsg });
              return;
            }

            const { email, statesFilterGroups } = element.client;

            const groupedRegions = await groupDataByRegion(sales, statesFilterGroups);

            if (!groupedRegions) {
              errors.push({ elementName: element.name, error: 'error grouping sales by region' });
              return;
            }

            const { msg: clockInsMsg, mode } = await getClockIns(
              element.initiativeId,
              start,
              end,
              reportType,
            );

            const { msg: lastWeekClockInsMsg, mode: lastWeekMode } = await getClockIns(
              element.initiativeId,
              beginningOfLastReport,
              lastReport,
              reportType,
            );

            if (Number.isNaN(mode)) {
              errors.push({ elementName: element.name, error: clockInsMsg });
              return;
            }

            if (Number.isNaN(lastWeekMode)) {
              errors.push({ elementName: element.name, error: lastWeekClockInsMsg });
              return;
            }

            const { msg: mslLevelsMessage, data: mslLevelData } = await findTop3CommonLevels(
              allMsl,
            );

            if (!mslLevelData) {
              errors.push({ elementName: element.name, error: mslLevelsMessage });
              return;
            }

            const { msg: storesMslLevelsMessage, data: storesMslLevelData } =
              await findTop3CommonLevelsForStores(allMsl);

            if (!storesMslLevelData) {
              errors.push({ elementName: element.name, error: storesMslLevelsMessage });
              return;
            }

            const { subuser } = await getInitiativeSubUsers(element.initiativeId);

            subuser.push(email);
            const emails = [
              ...subuser,
              'alex.osikhena@toplinemark.com',
              'Tayo.Olakolegan@toplinemark.com',
              'jayjaytobbey@gmail.com',
            ];

            const mail = await periodicMailTemplate({
              name: element.name,
              start,
              end,
              byBrandData,
              lastWeekData,
              attendanceAverage: mode,
              lastWeekAttendanceAverage: lastWeekMode,
              byStoreData,
              overAllMsl,
              lastWeekMslOverallMsl,
              productiveOutlets,
              lastWeekProductiveOutlet,
              overallStoreInventories,
              lastWeekOverallStoreInventories,
              groupedRegions,
              mslLevelData,
              storesMslLevelData,
              reportType,
            });

            // send to multiple
            await sendEmailToMultiple({
              emails,
              subject: `${reportType === 'weekly' ? 'Weekly' : 'Monthly'} report: ${
                element.name
              } - ${formatDate(start)} to ${formatDate(end)}`,
              htmlData: mail,
            });
          } catch (error) {
            // console.error(`Error processing initiative ${element.name}:`, error);
            errors.push({ elementName: element.name, error: error.message });
          }
        }),
      );
    }

    if (errors.length > 0) {
      return { msg: 'some errors', error: errors.message, status: StatusCodes.MULTI_STATUS };
    }

    return {
      msg: `${reportType || ''} mail sent successfully`,
      error: errors.message,
      status: StatusCodes.OK,
    };
  } catch (error) {
    // console.error('Error in periodicMail:', error);
    return { msg: 'unexpected error', error, status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const weeklyMail = async (req, res) => {
  try {
    const end = new Date(); // todo remove the date inside the bracket
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const lastReport = new Date(end);
    lastReport.setDate(end.getDate() - 7); // Subtract exactly 7 days to get last week saturday

    const beginningOfLastReport = new Date(lastReport);
    beginningOfLastReport.setDate(lastReport.getDate() - 6); // m

    if (start.getDay() !== 1 || end.getDay() !== 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: 'Start date must be a Monday and end date must be a Sunday' });
    }

    const { msg, status, error } = await gatherReport(
      start,
      end,
      lastReport,
      beginningOfLastReport,
      'weekly',
    );
    return res.status(status).json({ msg, error });
  } catch (error) {
    // console.error('Error in periodicMail:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Unexpected error occurred' });
  }
};

const monthlyMail = async (req, res) => {
  try {
    const today = new Date();

    // Check if today is the last day of the month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (today.getDate() !== endOfMonth.getDate()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Error: Today is not the last day of the month`,
      });
    }

    // If both conditions pass, continue with gathering the report

    const start = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1); // First day of the previous month

    const { msg, status, error } = await gatherReport(
      start,
      endOfMonth,
      lastMonthEnd,
      lastMonthStart,
      'monthly',
    );

    return res.status(status).json({ msg, error });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Unexpected error occurred' });
  }
};

const analytics = async (req, res) => {
  try {
    const end = req.query?.end ? new Date(req.query.end) : new Date();

    const date = new Date(end);
    date.setDate(end.getDate() - 6);

    const start = req.query?.start ? new Date(req.query.start) : date;

    const returnedDate = new Date(end.setDate(end.getDate() - 1));

    const initiativeId = req.query?.initiativeId;
    if (!initiativeId) {
      throw new createHttpError.BadRequest('provide initiative id');
    }

    // Fetch initiative and client data
    const userInitiative = await Initiative.findOne({
      _id: initiativeId,
    }).populate({
      path: 'client',
      select: '-_id email statesFilterGroups',
    });

    if (!userInitiative) {
      throw new createHttpError.BadRequest('no initiative with that id found!');
    }

    const errors = [];
    const { statesFilterGroups } = userInitiative.client;

    // Run independent asynchronous operations in parallel
    const [
      { msg: salesHelperMsg, sales },
      { msg: getAllMslMsg, allMsl },
      { msg: overallStoreInventoriesMsg, overallStoreInventories },
    ] = await Promise.all([
      getSalesOfAnInitiative(initiativeId, start, end),
      getAllMsl(initiativeId, start, end),
      getOverallStoreInventories(initiativeId, start, end),
    ]);

    // Error handling for parallel operations
    if (!sales) errors.push({ error: salesHelperMsg });
    if (!allMsl) errors.push({ error: getAllMslMsg });
    if (!overallStoreInventories) errors.push({ error: overallStoreInventoriesMsg });

    // Dependent operations (after sales and allMsl are available)
    const [
      byBrandData,
      byStoreData,
      { msg: mslMsg, overAllMsl },
      { msg: productiveOutletMsg, productiveOutlets },
      groupedRegions,
      { msg: mslLevelsMessage, data: mslLevelData },
      { msg: storesMslLevelsMessage, data: storesMslLevelData },
    ] = await Promise.all([
      getOverallSold(sales),
      getSalesByInitiativeStore(sales),
      getOverallMsl(allMsl),
      getProductiveOutlets(sales),
      groupDataByRegion(sales, statesFilterGroups),
      findTop3CommonLevels(allMsl),
      findTop3CommonLevelsForStores(allMsl),
    ]);

    // Error handling for dependent operations
    if (!byBrandData) errors.push({ error: 'Unable to generate overall sold data' });
    if (!byStoreData) errors.push({ error: 'Unable to generate sold data by stores' });
    if (Number.isNaN(overAllMsl)) errors.push({ error: mslMsg });
    if (Number.isNaN(productiveOutlets)) errors.push({ error: productiveOutletMsg });
    if (!groupedRegions) errors.push({ error: 'Error grouping sales by region' });
    if (!mslLevelData) errors.push({ error: mslLevelsMessage });
    if (!storesMslLevelData) errors.push({ error: storesMslLevelsMessage });

    if (errors.length) {
      throw new createHttpError.BadRequest('Error fetching analytics', errors);
    }

    // Prepare final result
    const result = {
      name: userInitiative.name,
      start,
      end: returnedDate,
      byBrandData,
      byStoreData,
      overAllMsl,
      productiveOutlets,
      overallStoreInventories,
      groupedRegions,
      mslLevelData,
      storesMslLevelData,
    };

    return res.status(StatusCodes.OK).json({ msg: 'analytics gotten', result });
  } catch (error) {
    console.error('Error in analytics:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Unexpected error occurred' });
  }
};

module.exports = { weeklyMail, monthlyMail, analytics };
