/* eslint-disable no-await-in-loop */
require('dotenv').config();
const cron = require('node-cron');

const Initiative = require('../models/initiative.model');
const Sale = require('../models/sale.model');

const { INITIATIVE_STATUS } = require('./constants');
const { sendInitiativeWeeklyReportEmail } = require('./email');
const logger = require('../utils/customLogger');
const Subuser = require('../models/subuser.model');

const initiativeWeeklyReportCron = cron.schedule('0 0 * * MON', async () => {
  try {
    const batchSize = 100;
    let skip = 0;
    let done = false;

    do {
      const initiatives = await Initiative.find({
        isDeleted: false,
        status: INITIATIVE_STATUS.ONGOING,
      })
        .skip(skip)
        .limit(batchSize)
        .populate({ path: 'client', select: 'companyName email' });

      if (initiatives.length > 0) {
        const promises = initiatives.map(async (initiative) => {
          try {
            const date = new Date();
            const startDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() - 6,
            ).toISOString();
            const currentDate = date.toISOString();

            const getSalesBrandsData = (sumField, sortOrder) => {
              return Sale.aggregate([
                {
                  $match: {
                    initiative: initiative._id,
                    date: { $gte: startDate, $lte: currentDate },
                  },
                },
                {
                  $group: {
                    _id: { brandName: '$brandName', sku: '$sku' },
                    total: { $sum: `$${sumField}` },
                  },
                },
                {
                  $sort: { total: sortOrder },
                },
                {
                  $limit: 5,
                },
                {
                  $project: {
                    _id: 0,
                    brandName: '$_id.brandName',
                    sku: '$_id.sku',
                    total: 1,
                  },
                },
              ]);
            };

            const getSalesStoresData = (sumField, sortOrder) => {
              return Sale.aggregate([
                {
                  $match: {
                    initiative: initiative._id,
                    date: { $gte: startDate, $lte: currentDate },
                  },
                },
                {
                  $group: {
                    _id: { initiativeStore: '$initiativeStore' },
                    total: { $sum: `$${sumField}` },
                  },
                },
                {
                  $lookup: {
                    from: 'initiative_stores',
                    localField: '_id.initiativeStore',
                    foreignField: '_id',
                    as: 'initiativeStore',
                  },
                },
                {
                  $lookup: {
                    from: 'stores',
                    localField: 'initiativeStore.store',
                    foreignField: '_id',
                    as: 'store',
                    pipeline: [
                      {
                        $project: {
                          name: 1,
                          streetNumber: 1,
                          streetName: 1,
                          state: 1,
                          area: 1,
                          town: 1,
                          ownerFirstName: 1,
                          ownerLastName: 1,
                          ownerPhoneNumber: 1,
                          imageURL: 1,
                        },
                      },
                    ],
                  },
                },
                {
                  $unwind: '$store',
                },
                {
                  $sort: { total: sortOrder },
                },
                {
                  $limit: 5,
                },
                {
                  $project: {
                    _id: 0,
                    total: 1,
                    store: 1,
                  },
                },
              ]);
            };

            if (initiative.client) {
              const topSalesBrandsByTotalCase = await getSalesBrandsData('totalCase', -1);
              const bottomSalesBrandsByTotalCase = await getSalesBrandsData('totalCase', 1);
              const topSalesBrandsByTotalValue = await getSalesBrandsData('totalValue', -1);
              const bottomSalesBrandsByTotalValue = await getSalesBrandsData('totalValue', 1);

              const topSalesStoresByTotalCase = await getSalesStoresData('totalCase', -1);
              const bottomSalesStoresByTotalCase = await getSalesStoresData('totalCase', 1);
              const topSalesStoresByTotalValue = await getSalesStoresData('totalValue', -1);
              const bottomSalesStoresByTotalValue = await getSalesStoresData('totalValue', 1);

              const subusersEmails = await Subuser.find({
                mainUser: initiative.client,
                initiatives: { $in: initiative._id },
                isDeleted: false,
              }).distinct('email');

              // Send email notification
              sendInitiativeWeeklyReportEmail({
                name: initiative.client.companyName,
                emails: [initiative.client.email, ...subusersEmails],
                startDate: new Date(startDate).toDateString(),
                currentDate: new Date(currentDate).toDateString(),
                initiativeName: initiative.name,
                topSalesBrandsByTotalCase,
                bottomSalesBrandsByTotalCase,
                topSalesBrandsByTotalValue,
                bottomSalesBrandsByTotalValue,
                topSalesStoresByTotalCase,
                bottomSalesStoresByTotalCase,
                topSalesStoresByTotalValue,
                bottomSalesStoresByTotalValue,
              });
            }
          } catch (error) {
            logger.error(`InitiativeWeeklyReportCron]: ${error.message}`);
          }
        });
        // By awaiting this promise, you ensure that all promises in the promises array are settled (i.e., either fulfilled or rejected) before moving on to the next batch of initiatives.
        // If you don't wait for Promise.allSettled(promises) to complete before processing the next batch of initiatives, there is a possibility that you may miss some initiatives or that some initiatives may be processed more than once.
        await Promise.allSettled(promises).catch((error) => {
          logger.error(`InitiativeWeeklyReportCron]: ${error.message}`);
        });

        skip += batchSize;
        done = initiatives.length < batchSize;
      }
    } while (!done);
  } catch (error) {
    logger.error(`InitiativeWeeklyReportCron]: ${error.message}`);
  }
});

module.exports = { initiativeWeeklyReportCron };
