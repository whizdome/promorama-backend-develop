const httpError = require('http-errors');

const Initiative = require('../models/initiative.model');
const InitiativeStore = require('../models/initiativeStore.model');
const Task = require('../models/task.model');
const InAppNotification = require('../models/inAppNotification.model');
const PushNotification = require('../models/pushNotification.model');

const APIFeatures = require('../utils/apiFeatures');
const { sendPushNotification } = require('../utils/pushNotification');
const socketIO = require('../helpers/socketIO');
const { sendTaskAssignedEmail } = require('../helpers/email');

const createTask = async (data) => {
  const { initiativeId, initiativeStoreIDs, ...taskData } = data;

  const initiative = await Initiative.findById(initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');
  if (initiative.isDeleted) throw new httpError.BadRequest('Initiative has been marked as deleted');

  const verifiedInitiativeStores = await InitiativeStore.find({
    _id: { $in: initiativeStoreIDs },
    initiative: initiativeId,
  }).populate({ path: 'promoter' });

  if (!verifiedInitiativeStores.length) {
    throw new httpError.BadRequest('None of the initiative store IDs is valid');
  }

  const assignedInitiativeStores = [];
  const promoterEmails = new Set();
  const promoterIDs = new Set();
  const socketIDs = new Set();

  verifiedInitiativeStores.forEach((doc) => {
    assignedInitiativeStores.push({ initiativeStore: doc.id });
    promoterEmails.add(doc.promoter.email);
    promoterIDs.add(doc.promoter.id);
    socketIDs.add(doc.promoter.socketId);
  });

  const task = await Task.create({
    initiative: initiativeId,
    ...taskData,
    assignedInitiativeStores,
  });

  // Send notification to promoters in initiative stores
  sendTaskAssignedEmail({
    emails: [...promoterEmails],
    taskName: task.name,
    initiativeName: initiative.name,
  });

  const text = `A new task '${task.name}' has been assigned to your store(s) for the '${initiative.name}' initiative`;
  const tokens = await PushNotification.getMultipleUsersDeviceTokens([...promoterIDs]);
  if (tokens.length) sendPushNotification({ title: 'New Task', body: text, tokens });

  InAppNotification.insertNotifications({
    userIDs: [...promoterIDs],
    entityId: task.id,
    type: 'Task',
    description: text,
  });
  socketIO.io.to([...socketIDs]).emit('newNotification', text);
};

const getInitiativeTasks = (initiativeId, reqQuery) => {
  const apiFeatures = new APIFeatures(Task.find({ initiative: initiativeId }), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  return apiFeatures.query;
};

const getInitiativeStoreTasks = (initiativeStoreId, reqQuery) => {
  const apiFeatures = new APIFeatures(
    Task.find({ 'assignedInitiativeStores.initiativeStore': initiativeStoreId }),
    reqQuery,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  return apiFeatures.query;
};

const getTaskDetails = (taskId) => {
  return Task.findById(taskId).populate({
    path: 'assignedInitiativeStores.initiativeStore',
    select: 'store',
    populate: {
      path: 'store',
      select: '-user -userModel -userRole -isDeleted -deletedAt -clients -updatedAt -__v',
    },
  });
};

const updateTaskDetails = (data) => {
  const { taskId, changes } = data;
  return Task.findByIdAndUpdate(taskId, changes, { new: true });
};

const assignInitiativeStores = async (data) => {
  const { taskId, initiativeStoreIDs } = data;

  const task = await Task.findById(taskId).populate({ path: 'initiative' });
  if (!task) throw new httpError.NotFound('Task not found');

  const verifiedInitiativeStores = await InitiativeStore.find({
    _id: { $in: initiativeStoreIDs },
    initiative: task.initiative.id,
  }).populate({ path: 'promoter' });

  if (!verifiedInitiativeStores.length) {
    throw new httpError.BadRequest('None of the initiative store IDs is valid');
  }

  // For Optimization i.e to avoid O(n^2) time complexity
  const existingInitiativeStoreIDs = new Set(
    task.assignedInitiativeStores.map((doc) => doc.initiativeStore.toString()),
  );

  const initiativeStoresToAssign = [];
  const promoterEmails = new Set();
  const promoterIDs = new Set();
  const socketIDs = new Set();

  verifiedInitiativeStores.forEach((doc) => {
    if (!existingInitiativeStoreIDs.has(doc.id)) {
      initiativeStoresToAssign.push({ initiativeStore: doc.id });
      promoterEmails.add(doc.promoter.email);
      promoterIDs.add(doc.promoter.id);
      socketIDs.add(doc.promoter.socketId);
    }
  });

  if (initiativeStoresToAssign.length) {
    await Task.updateOne(
      { _id: task },
      { $addToSet: { assignedInitiativeStores: { $each: initiativeStoresToAssign } } },
    );

    // Send notification to promoters in initiative stores
    sendTaskAssignedEmail({
      emails: [...promoterEmails],
      taskName: task.name,
      initiativeName: task.initiative.name,
    });

    const text = `A new task '${task.name}' has been assigned to your store(s) for the '${task.initiative.name}' initiative`;
    const tokens = await PushNotification.getMultipleUsersDeviceTokens([...promoterIDs]);
    if (tokens.length) sendPushNotification({ title: 'New Task', body: text, tokens });

    InAppNotification.insertNotifications({
      userIDs: [...promoterIDs],
      entityId: task.id,
      type: 'Task',
      description: text,
    });
    socketIO.io.to([...socketIDs]).emit('newNotification', text);
  }
};

const unassignInitiativeStores = async (data) => {
  const { taskId, initiativeStoreIDs } = data;

  const task = await Task.findById(taskId);
  if (!task) throw new httpError.NotFound('Task not found');

  await Task.updateOne(
    { _id: task },
    { $pull: { assignedInitiativeStores: { initiativeStore: { $in: initiativeStoreIDs } } } },
  );
};

const completeTask = async (data) => {
  const { taskId, initiativeStoreId, comment, uploadURLs } = data;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, 'assignedInitiativeStores.initiativeStore': initiativeStoreId },
    {
      $set: {
        'assignedInitiativeStores.$.reply': { comment, uploadURLs },
      },
    },
  ).populate({ path: 'initiative' });

  if (!task) throw new httpError.NotFound('Task not found or assigned');

  // Send notification to the admin
  // sendTaskCompletedEmail({ taskName: task.name, initiativeName: task.initiative.name });

  // InAppNotification.insertNotification({
  //   userId: 'admin',
  //   entityId: task.id,
  //   type: 'Task',
  //   description: `The task '${task.name}' for the initiative '${task.initiative.name}' has been completed in an initiative store`,
  // });
  // socketIO.io.emit('newNotification');
};

const deleteTask = (taskId) => {
  return Task.findByIdAndDelete(taskId);
};

module.exports = {
  createTask,
  getInitiativeTasks,
  getInitiativeStoreTasks,
  getTaskDetails,
  updateTaskDetails,
  assignInitiativeStores,
  unassignInitiativeStores,
  completeTask,
  deleteTask,
};
