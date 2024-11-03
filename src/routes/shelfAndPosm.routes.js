const express = require('express');

const shelfAndPosmController = require('../controllers/shelfAndPosm.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.use(isLoggedIn);

router.post('/', authorize(ROLE.PROMOTER, ROLE.SUPERVISOR), shelfAndPosmController.addNewData);

router.get('/', shelfAndPosmController.getShelfAndPosmDocs);

router.patch('/:docId', shelfAndPosmController.updateDoc);

router.delete('/:docId', shelfAndPosmController.deleteDoc);

module.exports = router;
