const express = require('express');

const taskController = require('../controllers/task.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.use(isLoggedIn);

router.post('/', authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), taskController.createTask);

router.get('/initiative-tasks/:initiativeId', taskController.getInitiativeTasks);
router.get('/initiative-store-tasks/:initiativeStoreId', taskController.getInitiativeStoreTasks);
router.get('/:taskId', taskController.getTaskDetails);

router.patch('/:taskId', authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), taskController.updateTaskDetails);
router.patch('/:taskId/complete', taskController.completeTask);
router.patch(
  '/:taskId/assign-initiative-stores',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  taskController.assignInitiativeStores,
);
router.patch(
  '/:taskId/unassign-initiative-stores',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  taskController.unassignInitiativeStores,
);

router.delete('/:taskId', authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), taskController.deleteTask);

module.exports = router;
