const express = require('express');
//

const messageController = require('../controllers/message.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router();

router.get('/excel', messageController.getMessagesInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.PROMOTER, ROLE.SUPERVISOR), messageController.createMessage);
router.post(
  '/initiatives/send-to-client',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  messageController.sendClientInitiativesMessages,
);

router.get('/title-options', messageController.getMessageTitleOptions);
router.get('/', messageController.getMessages);
router.get('/:messageId', messageController.getMessageDetails);

router.patch('/:messageId/respond', messageController.respondToMessage);
router.patch(
  '/:messageId/toggle-resolve-status',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT, ROLE.AGENCY, ROLE.BASIC_SUBUSER),
  messageController.toggleResolveStatus,
);

router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
