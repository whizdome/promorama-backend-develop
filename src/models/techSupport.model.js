const mongoose = require('mongoose');
const { TICKET_STATUS_ENUMS, TICKET_STATUS } = require('../helpers/constants');

const TechSupportTicketSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      minLength: 3,
      trim: true,
      required: [true, 'provide full name'],
    },
    email: {
      type: String,
      required: [true, 'provide email address'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'provide valid email address!',
      ],
      trim: true,
    },

    userId: {
      type: String,
      minLength: 3,
      trim: true,
      required: [true, 'provide user id'],
    },
    description: {
      type: String,
      minLength: 3,
      trim: true,
      required: [true, 'provide a description'],
    },

    status: {
      type: String,
      default: TICKET_STATUS.OPEN,
      enum: {
        values: TICKET_STATUS_ENUMS,
        message: '{VALUE} is not a valid status',
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Tech_Support_Ticket', TechSupportTicketSchema);
