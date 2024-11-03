const express = require('express');

const clientController = require('../controllers/client.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.get('/excel', clientController.getClientsInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPER_ADMIN, ROLE.AGENCY), clientController.addClient);
router.post('/employees', authorize(ROLE.CLIENT), clientController.addEmployee);
router.post(
  '/:clientId/states-filter-groups',
  authorize(ROLE.SUPER_ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  clientController.addStatesFilterGroup,
);

router.get('/', clientController.getAllClients);
router.get('/profile', authorize(ROLE.CLIENT), clientController.getClientProfile);
router.get(
  '/:clientId/employees',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.BASIC_SUBUSER),
  clientController.getEmployees,
);
router.get('/:clientId', clientController.getClientDetails);

router.patch('/change-password', authorize(ROLE.CLIENT), clientController.updateClientPassword);
router.patch('/:clientId', authorize(ROLE.SUPER_ADMIN), clientController.updateClientDetails);
router.patch('/:clientId/approve', authorize(ROLE.SUPER_ADMIN), clientController.approveClient);
router.patch('/:clientId/restore', authorize(ROLE.SUPER_ADMIN), clientController.restoreClient);
router.patch(
  '/:clientId/states-filter-groups/:groupId',
  authorize(ROLE.SUPER_ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  clientController.updateStatesFilterGroup,
);
router.patch(
  '/:clientId/show-on-store-creation',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  clientController.updateShowOnStoreCreationStatus,
);

router.delete('/:clientId', authorize(ROLE.SUPER_ADMIN), clientController.deleteClient);
router.delete('/:clientId/soft', authorize(ROLE.SUPER_ADMIN), clientController.softDeleteClient);
router.delete('/employees/:employeeId', authorize(ROLE.CLIENT), clientController.removeEmployee);
router.delete(
  '/:clientId/states-filter-groups/:groupId',
  authorize(ROLE.SUPER_ADMIN, ROLE.CLIENT, ROLE.AGENCY),
  clientController.deleteStatesFilterGroup,
);

module.exports = router;
