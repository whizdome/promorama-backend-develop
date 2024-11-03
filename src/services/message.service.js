const httpError = require('http-errors');

const InitiativeStore = require('../models/initiativeStore.model');
const Message = require('../models/message.model');
const InAppNotification = require('../models/inAppNotification.model');
const PushNotification = require('../models/pushNotification.model');
const Client = require('../models/client.model');
const Initiative = require('../models/initiative.model');

const APIFeatures = require('../utils/apiFeatures');
const {
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  ROLE,
  EXCEL_MAX_DOWNLOAD_RANGE,
  INITIATIVE_STATUS,
} = require('../helpers/constants');
const socketIO = require('../helpers/socketIO');
const { sendPushNotification } = require('../utils/pushNotification');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');
const logger = require('../utils/customLogger');
const { createExcelFileBufferWithExcelJS } = require('../helpers/excel');
// const { uploadRawFileToCloudinary } = require('../helpers/cloudinary');
const { sendClientInitiativesMessagesReportEmail } = require('../helpers/email');

const sendNotification = async ({
  userId,
  socketId,
  messageId,
  text,
  skipPush = false,
  broadcast = false,
}) => {
  InAppNotification.insertNotification({
    userId,
    entityId: messageId,
    type: 'Message',
    description: text,
  });

  if (broadcast) {
    socketIO.io.emit('newNotification');
  } else if (socketId) {
    socketIO.io.to(socketId).emit('newNotification', text);
  }

  if (!skipPush) {
    const tokens = await PushNotification.getUserDeviceTokens(userId);
    if (tokens.length) sendPushNotification({ title: 'Message', body: text, tokens });
  }
};

const createMessage = async (data) => {
  const { currentUser, messageData } = data;
  const { initiativeStoreId } = messageData;

  const initiativeStore = await InitiativeStore.findById(initiativeStoreId)
    .populate({ path: 'store', select: 'name' })
    .populate({ path: 'promoter', select: 'firstName email socketId' })
    .populate({ path: 'supervisor', select: 'firstName email socketId' })
    .populate({
      path: 'initiative',
      select: '_id name client agency',
      populate: [
        { path: 'client', select: 'companyName email socketId' },
        { path: 'agency', select: 'name email socketId' },
      ],
    });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  const message = new Message({
    initiative: initiativeStore.initiative,
    initiativeStore: initiativeStoreId,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...messageData,
  });
  await message.save();

  // Send notification
  const text = `New message from '${initiativeStore.store?.name}' store in '${initiativeStore.initiative?.name}' initiative`;

  sendNotification({
    userId: 'admin',
    messageId: message.id,
    text,
    skipPush: true,
    broadcast: true,
  });

  if (initiativeStore.initiative?.client) {
    sendNotification({
      userId: initiativeStore.initiative.client._id,
      socketId: initiativeStore.initiative.client.socketId,
      messageId: message.id,
      text,
      skipPush: true,
    });
  }

  if (initiativeStore.initiative?.agency) {
    sendNotification({
      userId: initiativeStore.initiative.agency._id,
      socketId: initiativeStore.initiative.agency.socketId,
      messageId: message.id,
      text,
      skipPush: true,
    });
  }

  const employeeNotificationData =
    currentUser.role !== ROLE.PROMOTER
      ? { userId: initiativeStore.promoter?._id, socketId: initiativeStore.promoter?.socketId }
      : { userId: initiativeStore.supervisor?._id, socketId: initiativeStore.supervisor?.socketId };

  if (employeeNotificationData.userId) {
    sendNotification({ ...employeeNotificationData, messageId: message.id, text });
  }

  return message;
};

const getMessages = async (reqQuery) => {
  const apiFeatures = new APIFeatures(Message.find({}), reqQuery)
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

  const messages = await apiFeatures.query;
  const totalCount = await Message.countDocuments({
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { messages, totalCount };
};

const getMessageDetails = async (messageId) => {
  const message = await Message.findById(messageId).populate({
    path: 'responses.user',
    select: 'firstName lastName companyName name email phoneNumber profilePicture role',
  });

  if (!message) throw new httpError.NotFound('Message not found');

  return message;
};

const getMessagesInExcel = async (reqQuery) => {
  const { startRange, endRange, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  const apiFeatures = new APIFeatures(Message.find({}), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const messages = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'initiativeStore',
      select: '-_id store',
      populate: { path: 'store', select: 'name phoneNumber state area town type' },
    })
    .populate({ path: 'user', select: 'firstName lastName role' });

  return messages.map((message) => ({
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
};

const respondToMessage = async (data) => {
  const { messageId, currentUser, responseData } = data;

  const message = await Message.findById(messageId);
  if (!message) throw new httpError.NotFound('Message not found');

  if (message.isResolved) throw new httpError.BadRequest('Message already marked as resolved');

  const initiativeStore = await InitiativeStore.findById(message.initiativeStore)
    .populate({ path: 'store', select: 'name' })
    .populate({ path: 'promoter', select: 'firstName email socketId' })
    .populate({ path: 'supervisor', select: 'firstName email socketId' })
    .populate({
      path: 'initiative',
      select: '_id name client agency',
      populate: [
        { path: 'client', select: 'companyName email socketId' },
        { path: 'agency', select: 'name email socketId' },
      ],
    });

  if (!initiativeStore) throw new httpError.NotFound('Initiative store not found');
  if (initiativeStore.isDeleted) {
    throw new httpError.BadRequest('Initiative store has been marked as deleted');
  }

  message.responses.push({
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    ...responseData,
  });
  await message.save();

  // Send notification
  const text = `New response to message from '${initiativeStore.store?.name}' store in '${initiativeStore.initiative?.name}' initiative`;

  if (currentUser.role !== ROLE.ADMIN && currentUser.role !== ROLE.SUPER_ADMIN) {
    sendNotification({
      userId: 'admin',
      messageId: message.id,
      text,
      skipPush: true,
      broadcast: true,
    });
  }

  if (currentUser.role !== ROLE.CLIENT && initiativeStore.initiative?.client) {
    sendNotification({
      userId: initiativeStore.initiative.client._id,
      socketId: initiativeStore.initiative.client.socketId,
      messageId: message.id,
      text,
      skipPush: true,
    });
  }

  if (currentUser.role !== ROLE.AGENCY && initiativeStore.initiative?.agency) {
    sendNotification({
      userId: initiativeStore.initiative.agency._id,
      socketId: initiativeStore.initiative.agency.socketId,
      messageId: message.id,
      text,
      skipPush: true,
    });
  }

  if (currentUser.role !== ROLE.PROMOTER && initiativeStore.promoter) {
    sendNotification({
      userId: initiativeStore.promoter._id,
      socketId: initiativeStore.promoter.socketId,
      messageId: message.id,
      text,
    });
  }

  if (currentUser.role !== ROLE.SUPERVISOR && initiativeStore.supervisor) {
    sendNotification({
      userId: initiativeStore.supervisor._id,
      socketId: initiativeStore.supervisor.socketId,
      messageId: message.id,
      text,
    });
  }

  return message;
};

const toggleResolveStatus = async (messageId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new httpError.NotFound('Message not found');

  message.isResolved = !message.isResolved;
  await message.save();
};

const deleteMessage = async (data) => {
  const { messageId, currentUser } = data;

  const message = await Message.findById(messageId);
  if (!message) throw new httpError.NotFound('Message not found');

  if (
    currentUser.role !== ROLE.SUPER_ADMIN &&
    (message.user.toString() !== currentUser.id || message.responses.length)
  ) {
    throw new httpError.Forbidden('You are not allowed to delete this message');
  }

  await message.deleteOne();
};

const sendClientInitiativesMessages = async (data) => {
  const { clientID, isResolved, startDate, endDate } = data;

  const client = await Client.findById(clientID);
  if (!client) throw new httpError.NotFound('Client not found');

  const getStartAndEndOfDay = (date) => {
    const dayStart = new Date(new Date(date).setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(date).setHours(23, 59, 59, 999));
    return { dayStart, dayEnd };
  };

  const initiatives = await Initiative.find(
    {
      client: client._id,
      isDeleted: false,
      status: INITIATIVE_STATUS.ONGOING,
    },
    { _id: 1, name: 1 },
  );

  if (!initiatives.length) throw new httpError.NotFound('No initiative found');

  const attachmentsData = [];

  const promises = initiatives.map(async (initiative) => {
    try {
      const filter = { initiative: initiative._id };

      if (isResolved !== undefined) filter.isResolved = isResolved;

      if (startDate && endDate) {
        filter.createdAt = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        const { dayStart, dayEnd } = getStartAndEndOfDay(startDate);
        filter.createdAt = { $gte: dayStart, $lte: dayEnd };
      } else if (endDate) {
        const { dayStart, dayEnd } = getStartAndEndOfDay(endDate);
        filter.createdAt = { $gte: dayStart, $lte: dayEnd };
      } else {
        const { dayStart, dayEnd } = getStartAndEndOfDay(new Date());
        filter.createdAt = { $gte: dayStart, $lte: dayEnd };
      }

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

        attachmentsData.push({ initiativeName: initiative.name, excelBuffer });

        // // Generate the excel file path
        // const fileName = `${initiative.name.replace(/\s/g, '_')}_messages_${initiative.id}.xlsx`;
        // const filePath = await createExcelFilePathWithJson2xls(excelData, fileName);

        // // Upload to Cloudinary
        // const fileUrl = await uploadRawFileToCloudinary(filePath, fileName);

        // // Collect the URL
        // attachmentsData.push({ initiativeName: initiative.name, fileUrl });
      } else {
        logger.info(
          `[SendClientInitiativesMessages]: No messages found for initiative ${initiative.name}`,
        );
      }
    } catch (error) {
      logger.error(
        `[SendClientInitiativesMessages]: Error processing messages for initiative ${initiative.name}: ${error.message}`,
      );
    }
  });

  // Wait for all promises to settle
  await Promise.allSettled(promises).catch((error) => {
    logger.error(`[SendClientInitiativesMessages]: ${error.message}`);
  });

  try {
    await sendClientInitiativesMessagesReportEmail({
      name: client.companyName,
      email: client.email,
      attachmentsData,
    });
  } catch (error) {
    logger.error(`[SendClientInitiativesMessages]: Error sending email: ${error.message}`);
    throw new httpError.UnprocessableEntity('Email could not be sent');
  }
};

module.exports = {
  createMessage,
  getMessages,
  getMessageDetails,
  getMessagesInExcel,
  respondToMessage,
  toggleResolveStatus,
  deleteMessage,
  sendClientInitiativesMessages,
};
