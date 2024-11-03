const techSupportTicketRouter = require('express').Router();
const {
  createTicket,
  getAllTickets,
  changeTicketStatus,
} = require('../controllers/techSupportTicket.controller');
const { ROLE } = require('../helpers/constants');
const { isLoggedIn, authorize } = require('../middleware/auth.middleware');

techSupportTicketRouter
  .post('/', isLoggedIn, authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), createTicket)

  .get('/', isLoggedIn, authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN), getAllTickets);

techSupportTicketRouter.patch(
  '/:id',
  isLoggedIn,
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  changeTicketStatus,
);

module.exports = { techSupportTicketRouter };
