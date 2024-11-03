const express = require('express');

const agencyController = require('../controllers/agency.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.get('/excel', agencyController.getAgenciesInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPER_ADMIN), agencyController.addAgency);
router.post('/employees', authorize(ROLE.AGENCY), agencyController.addEmployee);
router.post('/stores', authorize(ROLE.AGENCY), agencyController.addStore);

router.get('/', agencyController.getAgencies);
router.get('/profile', authorize(ROLE.AGENCY), agencyController.getAgencyProfile);
router.get('/employees', authorize(ROLE.AGENCY), agencyController.getEmployees);
router.get('/stores', authorize(ROLE.AGENCY), agencyController.getStores);
router.get(
  '/:agencyId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  agencyController.getAgencyDetails,
);

router.patch('/change-password', authorize(ROLE.AGENCY), agencyController.updateAgencyPassword);
router.patch('/:agencyId', authorize(ROLE.SUPER_ADMIN), agencyController.updateAgencyDetails);
router.patch('/:agencyId/restore', authorize(ROLE.SUPER_ADMIN), agencyController.restoreAgency);

router.delete('/:agencyId', authorize(ROLE.SUPER_ADMIN), agencyController.deleteAgency);
router.delete('/:agencyId/soft', authorize(ROLE.SUPER_ADMIN), agencyController.softDeleteAgency);
router.delete('/employees/:employeeId', authorize(ROLE.AGENCY), agencyController.removeEmployee);
router.delete('/stores/:storeId', authorize(ROLE.AGENCY), agencyController.removeStore);

module.exports = router;
