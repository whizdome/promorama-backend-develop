const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const techSupportModel = require('../models/techSupport.model');

const getTechSupportTickets = async ({ page = 1, limit = 100, searchQuery = '', status = '' }) => {
  try {
    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const skip = (pageNumber - 1) * limitNumber;

    // Construct query object
    const query = {};

    if (status) {
      query.status = status;
    }

    // If searchQuery is provided, attempt to search by _id or other fields
    if (searchQuery) {
      if (mongoose.Types.ObjectId.isValid(searchQuery)) {
        query._id = searchQuery;
      } else {
        query.$or = [
          { fullName: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { userId: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { status: { $regex: searchQuery, $options: 'i' } },
        ];
      }
    }

    // Fetch tickets with pagination and sorting
    const tickets = await techSupportModel
      .find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNumber);

    // Count total documents matching the query
    const totalCount = await techSupportModel.countDocuments(query);
    const hasNextPage = skip + limitNumber < totalCount;
    const hasPreviousPage = skip > 0;

    return {
      status: StatusCodes.OK,
      msg: 'success',
      tickets,
      totalCount,
      limit: limitNumber,
      page: pageNumber,
      hasPreviousPage,
      hasNextPage,
    };
  } catch (error) {
    return { status: StatusCodes.INTERNAL_SERVER_ERROR, msg: 'Unexpected error' };
  }
};

const getTechSupportTicketById = async (id) => {
  try {
    // Check if ID is provided and valid
    if (!id) {
      return { status: StatusCodes.BAD_REQUEST, msg: 'Provide an ID' };
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { status: StatusCodes.BAD_REQUEST, msg: 'Invalid ID format' };
    }

    // Fetch the ticket by ID
    const ticket = await techSupportModel.findById(id);

    // Check if the ticket exists
    if (!ticket) {
      return { status: StatusCodes.NOT_FOUND, msg: 'Ticket not found' };
    }

    return { status: StatusCodes.OK, msg: 'Success', ticket };
  } catch (error) {
    return { status: StatusCodes.INTERNAL_SERVER_ERROR, msg: 'Unexpected error' };
  }
};

module.exports = { getTechSupportTickets, getTechSupportTicketById };
