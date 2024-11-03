const dataTableRouter = require('express').Router();

const { dataTable } = require('../controllers/dataTable.controller');
const { ROLE } = require('../helpers/constants');
const { isLoggedIn, authorize } = require('../middleware/auth.middleware');

dataTableRouter.get('/', isLoggedIn, authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), dataTable);

module.exports = { dataTableRouter };
