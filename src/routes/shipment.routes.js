const express = require('express');

const shipmentController = require('../controllers/shipment.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');
const { multerUpload } = require('../config/multer.config');

const router = express.Router({ mergeParams: true });

router.get('/excel', shipmentController.getShipmentsInExcel);

router.use(isLoggedIn);

router.post('/', shipmentController.addShipment);
router.post(
  '/csv-upload',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.CLIENT),
  multerUpload.single('file'),
  shipmentController.addShipmentsViaUpload,
);

router.get('/', shipmentController.getShipments);
router.get('/aggregate', shipmentController.getAggregateShipments);
router.get('/aggregate/store', shipmentController.getAggregateShipmentsByStore);

router.delete('/:shipmentId', shipmentController.deleteShipment);

module.exports = router;
