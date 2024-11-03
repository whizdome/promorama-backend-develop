const Joi = require('joi');
const httpError = require('http-errors');

const taskService = require('../services/task.service');

const createTask = async (req, res) => {
  const { error } = Joi.object({
    initiativeId: Joi.string().required(),
    name: Joi.string().required(),
    dueDate: Joi.date().iso().required(),
    dueTime: Joi.string().required(),
    comment: Joi.string().required(),
    uploadURLs: Joi.array().items(Joi.string()),
    initiativeStoreIDs: Joi.array().items(Joi.string()).min(1).required(),
  }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await taskService.createTask(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Task created successfully',
  });
};

const getInitiativeTasks = async (req, res) => {
  const tasks = await taskService.getInitiativeTasks(req.params.initiativeId, req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Tasks retrieved successfully',
    data: tasks,
  });
};

const getInitiativeStoreTasks = async (req, res) => {
  const tasks = await taskService.getInitiativeStoreTasks(req.params.initiativeStoreId, req.query);

  return res.status(200).send({
    status: 'success',
    message: 'Tasks retrieved successfully',
    data: tasks,
  });
};

const getTaskDetails = async (req, res) => {
  const task = await taskService.getTaskDetails(req.params.taskId);
  if (!task) throw new httpError.NotFound('Task not found');

  return res.status(200).send({
    status: 'success',
    message: 'Task details retrieved successfully',
    data: task,
  });
};

const updateTaskDetails = async (req, res) => {
  const { error } = Joi.object({
    name: Joi.string(),
    dueDate: Joi.date().iso(),
    dueTime: Joi.string(),
    comment: Joi.string(),
    uploadURLs: Joi.array().items(Joi.string()),
  })
    .min(1)
    .validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const task = await taskService.updateTaskDetails({
    taskId: req.params.taskId,
    changes: req.body,
  });

  if (!task) throw new httpError.NotFound('Task not found');

  return res.status(200).send({
    status: 'success',
    message: 'Task updated successfully',
  });
};

const assignInitiativeStores = async (req, res) => {
  const { error } = Joi.object({
    initiativeStoreIDs: Joi.array().items(Joi.string()).min(1).required(),
  }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await taskService.assignInitiativeStores({ taskId: req.params.taskId, ...req.body });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores assigned successfully',
  });
};

const unassignInitiativeStores = async (req, res) => {
  const { error } = Joi.object({
    initiativeStoreIDs: Joi.array().items(Joi.string()).min(1).required(),
  }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await taskService.unassignInitiativeStores({ taskId: req.params.taskId, ...req.body });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores unassigned successfully',
  });
};

const completeTask = async (req, res) => {
  const { error } = Joi.object({
    initiativeStoreId: Joi.string().required(),
    comment: Joi.string().required(),
    uploadURLs: Joi.array().items(Joi.string()),
  }).validate(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await taskService.completeTask({
    taskId: req.params.taskId,
    ...req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Task completed successfully',
  });
};

const deleteTask = async (req, res) => {
  const task = await taskService.deleteTask(req.params.taskId);
  if (!task) throw new httpError.NotFound('Task not found');

  return res.status(200).send({
    status: 'success',
    message: 'Task deleted successfully',
  });
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
