/* eslint-disable no-await-in-loop */
require('dotenv').config();
const cron = require('node-cron');

const Initiative = require('../models/initiative.model');
const Subuser = require('../models/subuser.model');
const Message = require('../models/message.model');

const { INITIATIVE_STATUS, MODEL_NAME } = require('./constants');
const logger = require('../utils/customLogger');
const { createExcelFileBufferWithExcelJS } = require('./excel');
// const { uploadRawFileToCloudinary } = require('./cloudinary');
const { sendInitiativeMessagesReportEmail } = require('./email');

const initiativesMessagesReportCron = cron.schedule('0 9 * * *', async () => {
  try {
    const batchSize = 100;
    let skip = 0;
    let done = false;

    do {
      const initiatives = await Initiative.find(
        {
          isDeleted: false,
          status: INITIATIVE_STATUS.ONGOING,
        },
        { _id: 1, name: 1, client: 1 },
      )
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
              date.getDate() - 7,
            ).toISOString();
            const currentDate = date.toISOString();

            const filter = {
              initiative: initiative._id,
              createdAt: { $gte: startDate, $lte: currentDate },
            };

            if (initiative.client) {
              const messages = await Message.find(filter)
                .lean()
                .sort('-createdAt')
                .populate({
                  path: 'initiativeStore',
                  select: '-_id store',
                  populate: { path: 'store', select: 'name phoneNumber state area town type' },
                })
                .populate({ path: 'user', select: 'firstName lastName role' });

              if (messages.length) {
                const excelData = messages.map((message) => ({
                  'Issue Date': message.createdAt.toISOString().split('T')[0],
                  'Store Name': message.initiativeStore?.store?.name,
                  State: message.initiativeStore?.store?.state,
                  Title: message.title,
                  Description: message.description,
                  'Image Link': message.imageURL,
                  Status: message.isResolved ? 'Resolved' : 'Unresolved',
                  Creator: `${message.user?.firstName || ''} ${message.user?.lastName || ''}`,
                  'Creator Role': message.user?.role,
                }));

                const excelBuffer = await createExcelFileBufferWithExcelJS(excelData, {
                  resourceType: MODEL_NAME.MESSAGE,
                });

                // // Generate the excel file path
                // const fileName = `${initiative.name.replace(/\s/g, '_')}_messages_${
                //   initiative.id
                // }.xlsx`;
                // const filePath = await createExcelFilePathWithJson2xls(excelData, fileName);

                // // Upload to Cloudinary
                // const fileUrl = await uploadRawFileToCloudinary(filePath, fileName);

                const subusersEmails = await Subuser.find({
                  mainUser: initiative.client,
                  initiatives: { $in: initiative._id },
                  isDeleted: false,
                }).distinct('email');

                // Send email notification
                sendInitiativeMessagesReportEmail({
                  name: initiative.client.companyName,
                  emails: [initiative.client.email, ...subusersEmails],
                  startDate: new Date(startDate).toDateString(),
                  currentDate: new Date(currentDate).toDateString(),
                  initiativeName: initiative.name,
                  excelBuffer,
                });
              } else {
                logger.info(
                  `[InitiativesMessagesReportCron]: No messages found for initiative ${initiative.name}`,
                );
              }
            } else {
              logger.info(
                `[InitiativesMessagesReportCron]: Client not found on initiative ${initiative.name}`,
              );
            }
          } catch (error) {
            logger.error(`InitiativesMessagesReportCron]: ${error.message}`);
          }
        });

        await Promise.allSettled(promises).catch((error) => {
          logger.error(`InitiativesMessagesReportCron]: ${error.message}`);
        });

        skip += batchSize;
        done = initiatives.length < batchSize;
      }
    } while (!done);
  } catch (error) {
    logger.error(`InitiativesMessagesReportCron]: ${error.message}`);
  }
});

module.exports = { initiativesMessagesReportCron };
