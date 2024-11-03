/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-nested-ternary */
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const Initiative = require('../models/initiative.model');
const { INITIATIVE_STATUS } = require('./constants');
const Sale = require('../models/sale.model');
const StoreInventory = require('../models/storeInventory.model');
const MustStockList = require('../models/mustStockList.model');
const Attendance = require('../models/attendance.model');
const Subuser = require('../models/subuser.model');

const formatDate = (date) => date.toISOString().split('T')[0];

const getOngoingInitiative = async () => {
  try {
    const ongoingInitiatives = await Initiative.find({
      status: INITIATIVE_STATUS.ONGOING,
    }).populate({
      path: 'client',
      select: '-_id email statesFilterGroups',
    });

    const sanitizedOngoingInitiatives = ongoingInitiatives.map((item) => ({
      initiativeId: item._id,
      client: item.client,
      name: item.name,
      brands: item.brands,
    }));

    return {
      msg: 'on going initiatives gotten',
      status: StatusCodes.OK,
      sanitizedOngoingInitiatives,
    };
  } catch (error) {
    return { msg: 'error getting on going initiatives', status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const getSalesOfAnInitiative = async (id, start, end) => {
  try {
    // Parse the date strings for comparison
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Fetch sales within the date range
    const sales = await Sale.find({
      initiative: id,
      date: {
        $gte: formatDate(startDate),
        $lte: formatDate(endDate),
      },
    }).populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: {
        path: 'store',
        select: 'name streetNumber streetName state area town',
      },
    });

    return { msg: 'Initiative sales retrieved', status: StatusCodes.OK, sales };
  } catch (error) {
    return { msg: 'Error retrieving initiative sales', status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const getOverallSold = async (sales, lastWeek) => {
  try {
    // Calculate overall cases sold and revenue generated
    const overallCasesSold = sales.reduce((sum, sale) => sum + sale.totalCase, 0);
    const revenueGenerated = sales.reduce((sum, sale) => sum + sale.totalValue, 0);

    // Aggregate sales by brandName and SKU
    const aggregatedSalesByCases = sales.reduce((acc, sale) => {
      const key = `${sale.brandName}-${sale.sku}`;
      if (!acc[key]) {
        acc[key] = { brandName: sale.brandName, sku: sale.sku, totalCase: 0, totalValue: 0 };
      }
      acc[key].totalCase += sale.totalCase;
      acc[key].totalValue += sale.totalValue;
      return acc;
    }, {});

    let top3SalesByCases = [];
    let bottom3SalesByCases = [];
    let top3SalesByValue = [];
    let bottom3SalesByValue = [];

    if (!lastWeek) {
      // Convert aggregated results to arrays
      const aggregatedSalesArrayByCases = Object.values(aggregatedSalesByCases);

      // Sort the arrays by total cases sold
      aggregatedSalesArrayByCases.sort((a, b) => b.totalCase - a.totalCase);

      // Get the top 3 sales by cases
      top3SalesByCases = aggregatedSalesArrayByCases.slice(0, 3);

      // Filter out the top 3 from the remaining sales and get the bottom 3 sales by cases
      const bottomSalesByCases = aggregatedSalesArrayByCases.slice(3);
      bottom3SalesByCases = bottomSalesByCases.slice(-3);

      // Sort the arrays by total value generated (similar to cases, if needed)
      aggregatedSalesArrayByCases.sort((a, b) => b.totalValue - a.totalValue);

      // Get the top 3 sales by value
      top3SalesByValue = aggregatedSalesArrayByCases.slice(0, 3);

      // Filter out the top 3 from the remaining sales and get the bottom 3 sales by value
      const bottomSalesByValue = aggregatedSalesArrayByCases.slice(3);
      bottom3SalesByValue = bottomSalesByValue.slice(-3);
    }

    // Return the results
    return {
      overall: { overallCasesSold, revenueGenerated },
      salesByCases: { top3SalesByCases, bottom3SalesByCases },
      salesByValue: { top3SalesByValue, bottom3SalesByValue },
    };
  } catch (error) {
    return null;
  }
};

const getProductiveOutlets = async (sales) => {
  try {
    const uniqueIds = new Set(sales.map((item) => item?.initiativeStore?.store?._id.toString()));
    const productiveOutlets = uniqueIds.size;

    return {
      msg: 'Productive outlets',
      status: StatusCodes.OK,
      productiveOutlets,
    };
  } catch (error) {
    return { msg: 'error fetching productive outlets', status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const getSalesByInitiativeStore = async (sales) => {
  try {
    // Aggregate sales by initiativeStore
    const aggregatedSalesByStore = sales.reduce((acc, sale) => {
      const store = sale.initiativeStore;
      if (!acc[store]) {
        acc[store] = { initiativeStore: store, totalCase: 0, totalValue: 0 };
      }
      acc[store].totalCase += sale.totalCase;
      acc[store].totalValue += sale.totalValue;
      return acc;
    }, {});

    // Convert aggregated results to arrays
    const aggregatedSalesArrayByStore = Object.values(aggregatedSalesByStore);

    // Sort the arrays by total cases sold
    aggregatedSalesArrayByStore.sort((a, b) => b.totalCase - a.totalCase);

    // Get the top 3 sales by cases
    const top3SalesByCases = aggregatedSalesArrayByStore.slice(0, 3);

    // Filter out the top 3 from the remaining sales and get the bottom 3 sales by cases
    const bottomSalesByCases = aggregatedSalesArrayByStore.slice(3);
    const bottom3SalesByCases = bottomSalesByCases.slice(-3);

    // Sort the arrays by total value generated
    aggregatedSalesArrayByStore.sort((a, b) => b.totalValue - a.totalValue);

    // Get the top 3 sales by value
    const top3SalesByValue = aggregatedSalesArrayByStore.slice(0, 3);

    // Filter out the top 3 from the remaining sales and get the bottom 3 sales by value
    const bottomSalesByValue = aggregatedSalesArrayByStore.slice(3);
    const bottom3SalesByValue = bottomSalesByValue.slice(-3);

    return {
      salesByCases: { top3SalesByCases, bottom3SalesByCases },
      salesByValue: { top3SalesByValue, bottom3SalesByValue },
    };
  } catch (error) {
    return null;
  }
};

const getByWeeks = async (sales) => {
  try {
    // Initialize the data structure for days of the week
    const totalCaseData = [
      { day: 'Mon', totalCase: 0 },
      { day: 'Tue', totalCase: 0 },
      { day: 'Wed', totalCase: 0 },
      { day: 'Thu', totalCase: 0 },
      { day: 'Fri', totalCase: 0 },
      { day: 'Sat', totalCase: 0 },
      { day: 'Sun', totalCase: 0 },
    ];

    const totalValueData = [
      { day: 'Mon', totalValue: 0 },
      { day: 'Tue', totalValue: 0 },
      { day: 'Wed', totalValue: 0 },
      { day: 'Thu', totalValue: 0 },
      { day: 'Fri', totalValue: 0 },
      { day: 'Sat', totalValue: 0 },
      { day: 'Sun', totalValue: 0 },
    ];

    // Process the responses to sum up totalCase and totalValue per day
    sales.forEach((response) => {
      const dayOfWeek = new Date(response.date).getDay();
      totalCaseData[dayOfWeek].totalCase += response.totalCase;
      totalValueData[dayOfWeek].totalValue += response.totalValue;
    });

    return {
      msg: 'Sales by week retrieved',
      status: StatusCodes.OK,
      detailsByWeek: { totalCaseData, totalValueData },
    };
  } catch (error) {
    return { msg: 'error fetching details by weeks', status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const getAllMsl = async (id, start, end) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const query = {
      initiative: id,
      date: {
        $gte: formatDate(startDate),
        $lte: formatDate(endDate),
      },
    };

    const allMsl = await MustStockList.find(query).populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: {
        path: 'store',
        select: 'name streetNumber streetName state area town',
      },
    });

    return { msg: 'top & least level msl gotten', allMsl };
  } catch (error) {
    return {
      msg: 'error gettingall msl',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

const getOverallMsl = async (allMsl) => {
  try {
    const avgArray = allMsl.map((item) => item.level);
    const total = avgArray.reduce((sum, num) => sum + num, 0);
    const overAllMsl = avgArray.length > 0 ? total / avgArray.length : 0;

    return {
      msg: 'Overall MSL retrieved',
      status: StatusCodes.OK,
      overAllMsl,
    };
  } catch (error) {
    return { msg: 'error fetching details by weeks', status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const getOverallStoreInventories = async (initiativeId, startDate, endDate) => {
  try {
    const filter = {
      initiative: new mongoose.Types.ObjectId(initiativeId),
      updatedAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    const result = await StoreInventory.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: { brandName: '$brandName', sku: '$sku' },
          totalCase: { $sum: '$totalCase' },
          totalValue: { $sum: '$totalValue' },
        },
      },
      {
        $project: {
          _id: 0,
          brandName: '$_id.brandName',
          sku: '$_id.sku',
          totalCase: 1,
          totalValue: 1,
        },
      },
    ]);

    const casesArray = result.map((item) => item.totalCase);
    const valuesArray = result.map((item) => item.totalValue);

    const totalStoreInventoryCases = casesArray.reduce((sum, num) => sum + num, 0);
    const totalStoreInventoryValue = valuesArray.reduce((sum, num) => sum + num, 0);

    return {
      msg: 'Overall store inventories retrieved',
      status: StatusCodes.OK,
      overallStoreInventories: { totalStoreInventoryCases, totalStoreInventoryValue },
    };
  } catch (error) {
    return {
      msg: 'error fetching overall store inventories',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

const groupDataByStates = (sales) => {
  const groupedStates = {};

  sales.forEach((item) => {
    const { state } = item.initiativeStore.store;
    const totalCases = item.totalCase;
    const { totalValue } = item;

    if (!groupedStates[state]) {
      groupedStates[state] = { totalCases: 0, totalValue: 0 };
    }

    groupedStates[state].totalCases += totalCases;
    groupedStates[state].totalValue += totalValue;
  });

  // Convert the groupedStates object into an array
  return Object.entries(groupedStates).map(([state, data]) => ({
    [state]: data,
  }));
};

const groupDataByRegion = (sales, regions) => {
  // Create a state to region lookup map from the regions array
  const stateToRegionMap = {};

  regions.forEach((region) => {
    const { name, states } = region;
    states.forEach((state) => {
      stateToRegionMap[state] = name;
    });
  });

  const groupedRegions = {};

  sales.forEach((item) => {
    const state = item?.initiativeStore?.store?.state;
    const totalCases = item.totalCase;
    const { totalValue } = item;

    // Find the region for the current state
    const region = stateToRegionMap[state];

    if (!region) {
      // If the state is not found in the mapping, you can choose to skip it or handle it differently
      return;
    }

    // Initialize region data if not already done
    if (!groupedRegions[region]) {
      groupedRegions[region] = { totalCases: 0, totalValue: 0 };
    }

    // Add the values to the corresponding region
    groupedRegions[region].totalCases += totalCases;
    groupedRegions[region].totalValue += totalValue;
  });

  // Convert the groupedRegions object into an array
  return Object.entries(groupedRegions).map(([region, data]) => ({
    [region]: data,
  }));
};

const getClockIns = async (id, start, end, reportType) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  try {
    const clockIns = await Attendance.find({
      initiative: id,
      clockInDate: {
        $gte: formatDate(startDate),
        $lte: formatDate(endDate),
      },
    });

    const differenceInDays = reportType === 'weekly' ? 6 : 26;

    // Step 1: Group by clockInDate and then group by initiativeStore, counting unique users
    const groupedByDateAndStoreWithUserCount = clockIns.reduce((acc, item) => {
      const date = item.clockInDate;
      const store = item.initiativeStore;
      const user = item.user.toString(); // Use .toString() to avoid object reference issues with ObjectId

      // If the date doesn't exist in the accumulator, create an empty object for it
      if (!acc[date]) {
        acc[date] = {};
      }

      // If the store doesn't exist for the date, create an empty object with a Set to track unique users
      if (!acc[date][store]) {
        acc[date][store] = { userCount: 0, uniqueUsers: new Set() };
      }

      // Add the user to the Set of unique users for the store
      acc[date][store].uniqueUsers.add(user);

      // Update the user count (based on the size of the Set)
      acc[date][store].userCount = acc[date][store].uniqueUsers.size;

      return acc;
    }, {});

    let count = 0;
    for (const key in groupedByDateAndStoreWithUserCount) {
      const no = Object.keys(groupedByDateAndStoreWithUserCount[key]).length;
      count += no;
    }

    return {
      msg: 'Attendance per week retrieved',
      status: StatusCodes.OK,
      mode: count / differenceInDays,
    };
  } catch (error) {
    return { msg: 'Error getting mode of clock-ins', status: StatusCodes.INTERNAL_SERVER_ERROR };
  }
};

const findTop3CommonLevels = async (data) => {
  try {
    const levelCounts = { level1: {} };

    // Iterate over the data and count occurrences
    data.forEach((item) => {
      const key = JSON.stringify({
        brand: item.brandName,
        sku: item.sku,
      });
      if (item.level === 1) {
        levelCounts.level1[key] = (levelCounts.level1[key] || 0) + 1;
      }
    });

    const levelArray = [];

    for (const key in levelCounts.level1) {
      const { brand, sku } = JSON.parse(key) || '{}';

      levelArray.push({
        brand,
        sku,
        onesAppearances: levelCounts.level1[key],
      });
    }

    const percentagesArray = [];

    levelArray.forEach((element) => {
      const { brand, sku, onesAppearances } = element;

      const found = data.filter((item) => item.brandName === brand && item.sku === sku);
      percentagesArray.push({
        percentageAvailability: (onesAppearances * 100) / found.length,
        brand,
        sku,
      });
    });

    // Sort the data based on percentageAvailability in descending order
    percentagesArray.sort((a, b) => b.percentageAvailability - a.percentageAvailability);

    // Get the top 3
    const top3 = percentagesArray.slice(0, 3);

    // Filter the bottom 3 by excluding those that are in the top 3
    const bottom3 = percentagesArray
      .filter(
        (item) => !top3.some((topItem) => topItem.brand === item.brand && topItem.sku === item.sku),
      )
      .slice(-3);

    return { msg: 'top & least level msl gotten', data: { top3, bottom3 } };
  } catch (error) {
    return {
      msg: 'error getting top & least level msl gotten',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

const findTop3CommonLevelsForStores = async (data) => {
  try {
    const levelCounts = { level1: {} };

    // Iterate over the data and count occurrences
    data.forEach((item) => {
      const key = JSON.stringify({
        storeId: item?.initiativeStore?.store?._id,
        storeName: `${item?.initiativeStore?.store?.name}, ${
          item?.initiativeStore?.store?.streetNumber || ''
        } ${item?.initiativeStore?.store?.streetName}, ${item?.initiativeStore?.store?.town}, ${
          item?.initiativeStore?.store?.area
        }, ${item?.initiativeStore?.store?.state}`,
      });

      if (item.level === 1) {
        levelCounts.level1[key] = (levelCounts.level1[key] || 0) + 1;
      }
    });

    const levelArray = [];

    for (const key in levelCounts.level1) {
      const { storeId, storeName } = JSON.parse(key) || '{}';
      levelArray.push({
        storeId,
        storeName,
        onesAppearances: levelCounts.level1[key],
      });
    }

    const percentagesArray = [];

    levelArray.forEach((element) => {
      const { storeId, storeName, onesAppearances } = element;

      const found = data.filter((item) => item?.initiativeStore?.store?._id.toString() === storeId);

      percentagesArray.push({
        percentageAvailability: (onesAppearances * 100) / found.length,
        storeName,
      });
    });

    // Sort the data based on percentageAvailability in descending order
    percentagesArray.sort((a, b) => b.percentageAvailability - a.percentageAvailability);

    // Get the top 3
    const top3 = percentagesArray.slice(0, 3);

    // Filter the bottom 3 by excluding those that are in the top 3
    const bottom3 = percentagesArray
      .filter((item) => !top3.some((topItem) => topItem.storeName === item.storeName))
      .slice(-3);

    return { msg: 'top & least level msl gotten for stores', data: { top3, bottom3 } };
  } catch (error) {
    return {
      msg: 'error getting top & least level msl gotten',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

const getInitiativeSubUsers = async (id) => {
  try {
    const subuser = await Subuser.find({ initiatives: id });
    const sanitizedSubUser = subuser.map((item) => item.email);

    return { msg: 'sub users gotten for initiatives', subuser: sanitizedSubUser };
  } catch (error) {
    return {
      msg: 'error getting top & least level msl gotten',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

module.exports = {
  getOngoingInitiative,
  getSalesOfAnInitiative,
  getOverallSold,
  getSalesByInitiativeStore,
  getByWeeks,
  getOverallMsl,
  getProductiveOutlets,
  getOverallStoreInventories,
  groupDataByStates,
  groupDataByRegion,
  getClockIns,
  getAllMsl,
  findTop3CommonLevels,
  findTop3CommonLevelsForStores,
  getInitiativeSubUsers,
};
