const mongoose = require('mongoose');

const Initiative = require('../models/initiative.model');
const { parseProducts } = require('./parseProducts');

const processFilterGroupings = async (data) => {
  const {
    initiativeId,
    statesFilterGroupId,
    productsFilterGroupId,
    initiativeStoresFilterGroupId,
  } = data;

  const filter = {};

  const initiative = await Initiative.findById(initiativeId).populate({
    path: 'client',
    select: 'statesFilterGroups',
  });

  if (!initiative) return filter;

  if (productsFilterGroupId) {
    const groupDetails = initiative.productsFilterGroups.find(
      (group) => group._id.toString() === productsFilterGroupId,
    );

    if (groupDetails) {
      const { brandNames, SKUs } = parseProducts(groupDetails.products.join(','));
      filter.brandName = { $in: brandNames };
      filter.sku = { $in: SKUs };
    }
  }

  if (initiativeStoresFilterGroupId) {
    const groupDetails = initiative.initiativeStoresFilterGroups.find(
      (group) => group._id.toString() === initiativeStoresFilterGroupId,
    );

    if (groupDetails) {
      filter.initiativeStore = {
        $in: groupDetails.initiativeStoresIDs.map((id) => new mongoose.Types.ObjectId(id.trim())),
      };
    }
  }

  if (statesFilterGroupId) {
    const groupDetails = initiative.client?.statesFilterGroups?.find(
      (group) => group._id.toString() === statesFilterGroupId,
    );

    if (groupDetails) {
      filter.state = { $in: groupDetails.states };
    }
  }

  return filter;
};

module.exports = { processFilterGroupings };
