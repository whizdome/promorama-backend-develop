const httpError = require('http-errors');

const Store = require('../models/store.model');
const Client = require('../models/client.model');

const {
  ROLE,
  ROLE_TO_MODEL_MAPPING,
  MODEL_NAME,
  EXCEL_MAX_DOWNLOAD_RANGE,
} = require('../helpers/constants');
const APIFeatures = require('../utils/apiFeatures');
const escapeStringRegExp = require('../utils/escapeStringRegExp');
const processQueryParamsForFiltering = require('../utils/processQueryParamsForFiltering');

const addStore = async (data) => {
  const { currentUser, storeData } = data;
  const { name, state, area, coordinates, clientId } = storeData;

  if (clientId) {
    const client = await Client.findById(clientId);
    if (!client) throw new httpError.NotFound('Client not found');
  }

  const existingStore = await Store.findOne({ name, state, area }); // compound index needed;

  if (existingStore && !clientId) {
    throw new httpError.BadRequest(
      'A store with this combination of name, state, and area already exists',
    );
  }

  if (existingStore && clientId) {
    const store = await Store.findByIdAndUpdate(
      existingStore.id,
      { $addToSet: { clients: clientId } },
      { new: true },
    );

    return {
      store,
      message: 'Store already exists but the client was linked to the store successfully',
    };
  }

  const store = await Store.create({
    ...storeData,
    user: currentUser.id,
    userModel: ROLE_TO_MODEL_MAPPING[currentUser.role] || MODEL_NAME.EMPLOYEE,
    userRole: currentUser.role,
    isApproved: [ROLE.SUPER_ADMIN, ROLE.ADMIN].includes(currentUser.role),
    location: { type: 'Point', coordinates: [coordinates.longitude, coordinates.latitude] },
    clients: clientId ? [clientId] : [],
  });

  return {
    store,
    message: 'Store added successfully',
  };
};

const getAllStores = async (reqQuery) => {
  let filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter = {
      isDeleted: false,
      $or: [
        { name: { $regex: sanitizedTerm, $options: 'i' } },
        { state: { $regex: sanitizedTerm, $options: 'i' } },
        { area: { $regex: sanitizedTerm, $options: 'i' } },
        { town: { $regex: sanitizedTerm, $options: 'i' } },
        { ownerFirstName: { $regex: sanitizedTerm, $options: 'i' } },
        { ownerLastName: { $regex: sanitizedTerm, $options: 'i' } },
      ],
    };
  }

  const apiFeatures = new APIFeatures(Store.find(filter), reqQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({
      path: 'user',
      select: 'firstName lastName companyName name email phoneNumber profilePicture role',
    });

  const stores = await apiFeatures.query;
  const totalCount = await Store.countDocuments({
    ...filter,
    ...processQueryParamsForFiltering(reqQuery),
  });

  return { stores, totalCount };
};

const getStoresInExcel = async (reqQuery) => {
  let filter = { isDeleted: false };
  if (reqQuery.search) {
    /* Escape regexp special characters in the search term */
    const sanitizedTerm = escapeStringRegExp(reqQuery.search);

    filter = {
      isDeleted: false,
      $or: [
        { name: { $regex: sanitizedTerm, $options: 'i' } },
        { state: { $regex: sanitizedTerm, $options: 'i' } },
        { area: { $regex: sanitizedTerm, $options: 'i' } },
        { town: { $regex: sanitizedTerm, $options: 'i' } },
        { ownerFirstName: { $regex: sanitizedTerm, $options: 'i' } },
        { ownerLastName: { $regex: sanitizedTerm, $options: 'i' } },
      ],
    };
  }

  const { startRange, endRange, clientId, ...queryString } = reqQuery;

  if (endRange - startRange > EXCEL_MAX_DOWNLOAD_RANGE) {
    throw new httpError.BadRequest(
      `You can only download ${EXCEL_MAX_DOWNLOAD_RANGE.toLocaleString()} documents at once. Adjust the range`,
    );
  }

  if (clientId) filter.clients = { $in: clientId };

  const apiFeatures = new APIFeatures(Store.find(filter), queryString).filter().sort();

  const skip = Number(startRange) - 1; // Adjusting for 1-based indexing
  const limit = Number(endRange) - Number(startRange) + 1;

  const stores = await apiFeatures.query.skip(skip).limit(limit).populate({
    path: 'user',
    select: 'firstName lastName companyName name role',
  });

  return stores.map((store) => ({
    Name: store.name,
    'Phone Number': store.phoneNumber,
    'Street Number': store.streetNumber,
    'Street Name': store.streetName,
    State: store.state,
    Area: store.area,
    Town: store.town,
    "Owner's Name": `${store.ownerFirstName} ${store.ownerLastName}`,
    "Owner's Phone Number": store.ownerPhoneNumber,
    Category: store.category,
    Type: store.type,
    Level: store.level,
    'Google Map URL': `https://www.google.com/maps?q=${store.location.coordinates[1]},${store.location.coordinates[0]}`,
    'Image URL': store.imageURL,
    'Approval Status': store.isApproved,
    Team: store.team,
    'Creation Date': store.createdAt.toISOString().split('T')[0],
    Brand: store.brand,
    'Additional Info': store.additionalInfo,
    Creator: `${
      store.user?.role === ROLE.CLIENT || store.user?.role === ROLE.AGENCY
        ? store.user?.companyName || store.user?.name || ''
        : `${store.user?.firstName || ''} ${store.user?.lastName || ''}`
    }`,
    'Creator Role': store.user?.role,
  }));
};

const getNearestStores = async (reqQuery) => {
  const { lat, lng, distInKM } = reqQuery;

  // const radius = distInMiles / 3963.2;
  const radius = distInKM / 6378.1;

  return Store.find({
    location: { $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] } },
  });
};

const getStoreDetails = (storeId) => {
  return Store.findById(storeId).populate({
    path: 'user',
    select: 'firstName lastName companyName name email phoneNumber profilePicture role',
  });
};

const updateStoreDetails = async (data) => {
  const { currentUser, storeId, changes } = data;
  const { name, state, area } = changes;

  const existingStore = await Store.findOne({ _id: { $ne: storeId }, name, state, area });
  if (existingStore) {
    throw new httpError.BadRequest(
      'A store with this combination of name, state, and area already exists',
    );
  }

  const store = await Store.findById(storeId);
  if (!store) throw new httpError.NotFound('Store not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && store.isApproved) {
    throw new httpError.BadRequest('The store has already been approved');
  }

  if (currentUser.role !== ROLE.SUPER_ADMIN && currentUser.id !== store.user.toString()) {
    throw new httpError.Forbidden('You are not allowed to update this store details');
  }

  return Store.findByIdAndUpdate(storeId, changes, { new: true });
};

const approveStore = (storeId) => {
  return Store.findByIdAndUpdate(storeId, { $set: { isApproved: true } }, { new: true });
};

const deleteStore = async (data) => {
  const { storeId, currentUser } = data;

  const store = await Store.findById(storeId);
  if (!store) throw new httpError.NotFound('Store not found');

  if (currentUser.role !== ROLE.SUPER_ADMIN && store.isApproved) {
    throw new httpError.BadRequest('The store has already been approved');
  }

  if (currentUser.role !== ROLE.SUPER_ADMIN && currentUser.id !== store.user.toString()) {
    throw new httpError.Forbidden('You are not allowed to delete this store');
  }

  return Store.deleteOne({ _id: storeId });
};

const softDeleteStore = (storeId) => {
  return Store.findByIdAndUpdate(
    storeId,
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true },
  );
};

const restoreStore = (storeId) => {
  return Store.findByIdAndUpdate(
    storeId,
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true },
  );
};

const addClient = async (data) => {
  const { storeId, clientId } = data;

  const client = await Client.findById(clientId);
  if (!client) throw new httpError.NotFound('Client not found');

  return Store.findByIdAndUpdate(storeId, { $addToSet: { clients: clientId } }, { new: true });
};

const removeClient = (data) => {
  const { storeId, clientId } = data;

  return Store.findByIdAndUpdate(storeId, { $pull: { clients: clientId } }, { new: true });
};

module.exports = {
  addStore,
  getAllStores,
  getStoresInExcel,
  getNearestStores,
  getStoreDetails,
  updateStoreDetails,
  approveStore,
  deleteStore,
  softDeleteStore,
  restoreStore,
  addClient,
  removeClient,
};
