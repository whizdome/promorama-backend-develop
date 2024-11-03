const { StatusCodes } = require('http-status-codes');
const techSupportModel = require('../models/techSupport.model');
const {
  getTechSupportTickets,
  getTechSupportTicketById,
} = require('../services/techSupportTicket.service');
const { sendEmail } = require('../helpers/email');

const { TICKET_STATUS, TICKET_STATUS_SUBJECT_MAP } = require('../helpers/constants');
const { createTicketJoi } = require('../helpers/validators/techSupport.validators');
const { getTechSupportTicketTemplate } = require('../helpers/templates/techSupportTicket');

const createTicket = async (req, res) => {
  try {
    const { error, value } = createTicketJoi.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: error.details[0].message });
    }

    const { userId } = value;

    const ticketRunning = await techSupportModel.findOne({
      userId,
      status: { $in: [TICKET_STATUS.OPEN, TICKET_STATUS.IN_PROGRESS] },
    });
    if (ticketRunning) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "There's a ticket for this user currently running. Only one ticket at a time is allowed.",
      });
    }

    const ticket = await techSupportModel.create(value);
    const htmlData = await getTechSupportTicketTemplate({
      status: ticket.status,
      fullName: ticket.fullName,
      ticketId: ticket._id,
    });

    await sendEmail({
      email: ticket.email,
      subject: TICKET_STATUS_SUBJECT_MAP[ticket.status],
      htmlData,
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ msg: 'Ticket created successfully', ticketId: ticket._id });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Unexpected error occurred' });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const resp = await getTechSupportTickets(req.query);

    const { status, msg, tickets, totalCount, limit, page, hasPreviousPage, hasNextPage } = resp;
    return res
      .status(status)
      .json({ msg, tickets, totalCount, limit, page, hasPreviousPage, hasNextPage });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Unexpected error occurred' });
  }
};

const changeTicketStatus = async (req, res) => {
  try {
    const { status } = req.query;
    if (!status) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Provide status' });
    }

    // Fetch the ticket by ID
    const resp = await getTechSupportTicketById(req.params.id);

    const { msg, ticket } = resp;
    if (resp.status !== StatusCodes.OK) {
      return res.status(StatusCodes.BAD_GATEWAY).json({ msg });
    }

    // Update the ticket status
    const updatedTicket = await techSupportModel.findOneAndUpdate(
      { _id: ticket._id },
      { status },
      { new: true, runValidators: true },
    );

    const { email } = updatedTicket;

    const subject = TICKET_STATUS_SUBJECT_MAP[updatedTicket.status];

    const htmlData = getTechSupportTicketTemplate({
      status: updatedTicket.status,
      fullName: updatedTicket.fullName,
      ticketId: updatedTicket._id,
    });

    await sendEmail({ email, subject, htmlData });

    return res.status(StatusCodes.OK).json({ msg: 'Status updated successfully', updatedTicket });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Unexpected error occurred' });
  }
};

module.exports = { createTicket, getAllTickets, changeTicketStatus };
