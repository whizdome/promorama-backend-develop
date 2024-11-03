const httpError = require('http-errors');
const Joi = require('joi');

const initiativeService = require('../services/initiative.service');

const {
  validateInitiativeMechanicsData,
  validateInitiativeBrandData,
  validateShelfAndPosmImagesData,
  validateInitiativeUpdatesData,
  validateInitiativeCustomBrandData,
  validateInitiativeStoresFilterGroupData,
  validateProductsFilterGroupData,
  validateInitiativeGameCreationData,
  validateInitiativeGameUpdateData,
  validateGamePrizeOptionData,
} = require('../helpers/validators/initiative.validators');
const { ROLE, INITIATIVE_STATUS } = require('../helpers/constants');

const createInitiative = async (req, res) => {
  const { error } = validateInitiativeMechanicsData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  if (req.user.role === ROLE.CLIENT && req.user.id !== req.body.clientId) {
    throw new httpError.Forbidden('You cannot create an initiative for another client');
  }

  if (req.user.role === ROLE.AGENCY && req.user.id !== req.body.agencyId) {
    throw new httpError.Forbidden('You cannot create an initiative for another agency');
  }

  const initiative = await initiativeService.createInitiative(req.body);

  return res.status(201).send({
    status: 'success',
    message: 'Initiative created successfully',
    data: initiative,
  });
};

const addBrand = async (req, res) => {
  const { error } = validateInitiativeBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addBrand({
    initiativeId: req.params.initiativeId,
    brandData: req.body,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Brand added successfully',
    data: initiative,
  });
};

const updateBrandDetails = async (req, res) => {
  const { error } = validateInitiativeBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateBrandDetails({
    initiativeId: req.params.initiativeId,
    brandId: req.params.brandId,
    brandData: req.body,
    currentUser: req.user,
  });

  if (!initiative) throw new httpError.NotFound('Initiative not found');

  return res.status(200).send({
    status: 'success',
    message: 'Brand details updated successfully',
    data: initiative,
  });
};

const deleteBrand = async (req, res) => {
  const initiative = await initiativeService.deleteBrand({
    initiativeId: req.params.initiativeId,
    brandId: req.params.brandId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Brand deleted successfully',
    data: initiative,
  });
};

const addShelfAndPosmImages = async (req, res) => {
  const { error } = validateShelfAndPosmImagesData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addShelfAndPosmImages({
    initiativeId: req.params.initiativeId,
    currentUser: req.user,
    ...req.body,
  });

  if (!initiative) throw new httpError.NotFound('Initiative not found');

  return res.status(200).send({
    status: 'success',
    message: 'Shelf and POSM images added successfully',
    data: initiative,
  });
};

const getAllInitiatives = async (req, res) => {
  const { initiatives, totalCount } = await initiativeService.getAllInitiatives(
    req.user,
    req.query,
  );

  return res.status(200).send({
    status: 'success',
    message: 'Initiatives retrieved successfully',
    totalCount,
    data: initiatives,
  });
};

const getInitiativeDetails = async (req, res) => {
  const initiative = await initiativeService.getInitiativeDetails(req.params.initiativeId);
  if (!initiative) throw new httpError.NotFound('Initiative not found');

  return res.status(200).send({
    status: 'success',
    message: 'Initiative details retrieved successfully',
    data: initiative,
  });
};

const updateInitiativeDetails = async (req, res) => {
  const { error } = validateInitiativeUpdatesData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateInitiativeDetails({
    initiativeId: req.params.initiativeId,
    changes: req.body,
    currentUser: req.user,
  });

  if (!initiative) throw new httpError.NotFound('Initiative not found');

  return res.status(200).send({
    status: 'success',
    message: 'Initiative details updated successfully',
    data: initiative,
  });
};

const changeInitiativeStatus = async (req, res) => {
  const { error } = Joi.object({
    status: Joi.string()
      .valid(INITIATIVE_STATUS.PENDING, INITIATIVE_STATUS.ONGOING, INITIATIVE_STATUS.COMPLETED)
      .required(),
    date: Joi.when('status', {
      is: Joi.exist().valid(INITIATIVE_STATUS.PENDING),
      then: Joi.forbidden(),
      otherwise: Joi.date().iso(),
    }),
  }).validate(req.body);

  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.changeInitiativeStatus({
    initiativeId: req.params.initiativeId,
    changes: req.body,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative status updated successfully',
    data: initiative,
  });
};

const deleteInitiative = async (req, res) => {
  await initiativeService.deleteInitiative({
    initiativeId: req.params.initiativeId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative deleted successfully',
  });
};

const softDeleteInitiative = async (req, res) => {
  await initiativeService.softDeleteInitiative({
    initiativeId: req.params.initiativeId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative soft-deleted successfully',
  });
};

const restoreInitiative = async (req, res) => {
  await initiativeService.restoreInitiative({
    initiativeId: req.params.initiativeId,
    currentUser: req.user,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative restored successfully',
  });
};

const addGame = async (req, res) => {
  const { error } = validateInitiativeGameCreationData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addGame({
    initiativeId: req.params.initiativeId,
    gameData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game added successfully',
    data: initiative,
  });
};

const updateGameDetails = async (req, res) => {
  const { error } = validateInitiativeGameUpdateData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateGameDetails({
    initiativeId: req.params.initiativeId,
    gameId: req.params.gameId,
    gameData: req.body,
  });

  if (!initiative) throw new httpError.NotFound('Initiative not found');

  return res.status(200).send({
    status: 'success',
    message: 'Game details updated successfully',
    data: initiative,
  });
};

const deleteGame = async (req, res) => {
  const initiative = await initiativeService.deleteGame({
    initiativeId: req.params.initiativeId,
    gameId: req.params.gameId,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game deleted successfully',
    data: initiative,
  });
};

const addGamePrizeOption = async (req, res) => {
  const { error } = validateGamePrizeOptionData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addGamePrizeOption({
    initiativeId: req.params.initiativeId,
    gamePrizeOptionData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game prize option added successfully',
    data: initiative,
  });
};

const updateGamePrizeOption = async (req, res) => {
  const { error } = validateGamePrizeOptionData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateGamePrizeOption({
    ...req.params,
    gamePrizeOptionData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Game prize option updated successfully',
    data: initiative,
  });
};

const deleteGamePrizeOption = async (req, res) => {
  const initiative = await initiativeService.deleteGamePrizeOption({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'Game prize option deleted successfully',
    data: initiative,
  });
};

const assignAgency = async (req, res) => {
  if (!req.body.agencyId) throw new httpError.BadRequest('"agencyId" is required');

  const initiative = await initiativeService.assignAgency({
    initiativeId: req.params.initiativeId,
    agencyId: req.body.agencyId,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Agency assigned to the initiative successfully',
    data: initiative,
  });
};

const unassignAgency = async (req, res) => {
  const initiative = await initiativeService.unassignAgency(req.params.initiativeId);

  return res.status(200).send({
    status: 'success',
    message: 'Agency unassigned from the initiative successfully',
    data: initiative,
  });
};

const addCompetitorBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addCompetitorBrand({
    initiativeId: req.params.initiativeId,
    competitorBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Competitor brand added successfully',
    data: initiative,
  });
};

const updateCompetitorBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateCompetitorBrand({
    ...req.params,
    competitorBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Competitor brand updated successfully',
    data: initiative,
  });
};

const deleteCompetitorBrand = async (req, res) => {
  const initiative = await initiativeService.deleteCompetitorBrand({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'Competitor brand deleted successfully',
    data: initiative,
  });
};

const addInitiativeStoresFilterGroup = async (req, res) => {
  const { error } = validateInitiativeStoresFilterGroupData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeService.addInitiativeStoresFilterGroup({
    initiativeId: req.params.initiativeId,
    reqBody: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores filter group added successfully',
  });
};

const getInitiativeStoresFilterGroup = async (req, res) => {
  const initiativeStores = await initiativeService.getInitiativeStoresFilterGroup({
    ...req.params,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores filter group retrieved successfully',
    data: initiativeStores,
  });
};

const updateInitiativeStoresFilterGroup = async (req, res) => {
  const { error } = validateInitiativeStoresFilterGroupData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeService.updateInitiativeStoresFilterGroup({ ...req.params, changes: req.body });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores filter group updated successfully',
  });
};

const deleteInitiativeStoresFilterGroup = async (req, res) => {
  await initiativeService.deleteInitiativeStoresFilterGroup({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'Initiative stores filter group deleted successfully',
  });
};

const addProductsFilterGroup = async (req, res) => {
  const { error } = validateProductsFilterGroupData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeService.addProductsFilterGroup({
    initiativeId: req.params.initiativeId,
    reqBody: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Products filter group added successfully',
  });
};

const updateProductsFilterGroup = async (req, res) => {
  const { error } = validateProductsFilterGroupData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  await initiativeService.updateProductsFilterGroup({ ...req.params, changes: req.body });

  return res.status(200).send({
    status: 'success',
    message: 'Products filter group updated successfully',
  });
};

const deleteProductsFilterGroup = async (req, res) => {
  await initiativeService.deleteProductsFilterGroup({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'Products filter group deleted successfully',
  });
};

const addMSLBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addMSLBrand({
    initiativeId: req.params.initiativeId,
    mslBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'MSL brand added successfully',
    data: initiative,
  });
};

const updateMSLBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateMSLBrand({
    ...req.params,
    mslBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'MSL brand updated successfully',
    data: initiative,
  });
};

const deleteMSLBrand = async (req, res) => {
  const initiative = await initiativeService.deleteMSLBrand({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'MSL brand deleted successfully',
    data: initiative,
  });
};

const addSOSBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addSOSBrand({
    initiativeId: req.params.initiativeId,
    sosBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'SOS brand added successfully',
    data: initiative,
  });
};

const updateSOSBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateSOSBrand({
    ...req.params,
    sosBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'SOS brand updated successfully',
    data: initiative,
  });
};

const deleteSOSBrand = async (req, res) => {
  const initiative = await initiativeService.deleteSOSBrand({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'SOS brand deleted successfully',
    data: initiative,
  });
};

const addOrderBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addOrderBrand({
    initiativeId: req.params.initiativeId,
    orderBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Order brand added successfully',
    data: initiative,
  });
};

const updateOrderBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updateOrderBrand({
    ...req.params,
    orderBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Order brand updated successfully',
    data: initiative,
  });
};

const deleteOrderBrand = async (req, res) => {
  const initiative = await initiativeService.deleteOrderBrand({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'Order brand deleted successfully',
    data: initiative,
  });
};

const addPaymentBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.addPaymentBrand({
    initiativeId: req.params.initiativeId,
    paymentBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Payment brand added successfully',
    data: initiative,
  });
};

const updatePaymentBrand = async (req, res) => {
  const { error } = validateInitiativeCustomBrandData(req.body);
  if (error) throw new httpError.BadRequest(error.message);

  const initiative = await initiativeService.updatePaymentBrand({
    ...req.params,
    paymentBrandData: req.body,
  });

  return res.status(200).send({
    status: 'success',
    message: 'Payment brand updated successfully',
    data: initiative,
  });
};

const deletePaymentBrand = async (req, res) => {
  const initiative = await initiativeService.deletePaymentBrand({ ...req.params });

  return res.status(200).send({
    status: 'success',
    message: 'Payment brand deleted successfully',
    data: initiative,
  });
};

module.exports = {
  createInitiative,
  addBrand,
  updateBrandDetails,
  deleteBrand,
  addShelfAndPosmImages,
  getAllInitiatives,
  getInitiativeDetails,
  updateInitiativeDetails,
  changeInitiativeStatus,
  deleteInitiative,
  softDeleteInitiative,
  restoreInitiative,
  addGame,
  updateGameDetails,
  deleteGame,
  addGamePrizeOption,
  updateGamePrizeOption,
  deleteGamePrizeOption,
  assignAgency,
  unassignAgency,
  addCompetitorBrand,
  updateCompetitorBrand,
  deleteCompetitorBrand,
  addInitiativeStoresFilterGroup,
  getInitiativeStoresFilterGroup,
  updateInitiativeStoresFilterGroup,
  deleteInitiativeStoresFilterGroup,
  addProductsFilterGroup,
  updateProductsFilterGroup,
  deleteProductsFilterGroup,
  addMSLBrand,
  updateMSLBrand,
  deleteMSLBrand,
  addSOSBrand,
  updateSOSBrand,
  deleteSOSBrand,
  addOrderBrand,
  updateOrderBrand,
  deleteOrderBrand,
  addPaymentBrand,
  updatePaymentBrand,
  deletePaymentBrand,
};
