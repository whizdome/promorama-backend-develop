const express = require('express');

const employeeController = require('../controllers/employee.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.get('/excel', employeeController.getEmployeesInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), employeeController.addEmployee);
router.post(
  '/request-device-change',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  employeeController.requestDeviceChange,
);
router.post(
  '/invite',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.AGENCY, ROLE.CLIENT),
  employeeController.sendInvite,
);

router.get('/', employeeController.getAllEmployees);
router.get(
  '/profile',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  employeeController.getEmployeeProfile,
);
router.get('/:employeeId', employeeController.getEmployeeDetails);
router.get('/:employeeId/team-members', employeeController.getTeamMembers);

router.patch(
  '/change-password',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  employeeController.updateEmployeePassword,
);
router.patch(
  '/link-device',
  authorize(ROLE.PROMOTER, ROLE.SUPERVISOR),
  employeeController.linkDevice,
);
router.patch('/:employeeId', employeeController.updateEmployeeDetails);
router.patch(
  '/:employeeId/restore',
  authorize(ROLE.SUPER_ADMIN),
  employeeController.restoreEmployee,
);
router.patch(
  '/:employeeId/enable-device-change',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.AGENCY),
  employeeController.enableDeviceChange,
);
router.patch(
  '/:employeeId/assign-team-members',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  employeeController.assignTeamMembers,
);
router.patch(
  '/:employeeId/unassign-team-members',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  employeeController.unassignTeamMembers,
);

router.delete(
  '/:employeeId',
  authorize(ROLE.SUPER_ADMIN, ROLE.PROMOTER, ROLE.SUPERVISOR),
  employeeController.deleteEmployee,
);
router.delete(
  '/:employeeId/soft',
  authorize(ROLE.SUPER_ADMIN, ROLE.PROMOTER, ROLE.SUPERVISOR),
  employeeController.softDeleteEmployee,
);

module.exports = router;
