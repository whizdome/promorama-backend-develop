const express = require('express');

const gameWinnerController = require('../controllers/gameWinner.controller');

const { isLoggedIn, authorize } = require('../middleware/auth.middleware');
const { ROLE } = require('../helpers/constants');

const router = express.Router({ mergeParams: true });

router.get('/excel', gameWinnerController.getGameWinnersInExcel);

router.use(isLoggedIn);

router.post('/', authorize(ROLE.PROMOTER), gameWinnerController.addGameWinner);

router.get('/', gameWinnerController.getAllGameWinners);
router.get(
  '/prize-won-aggregates/initiative',
  gameWinnerController.getPrizeWonAggregatesForInitiative,
);

router.patch(
  '/:gameWinnerId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.PROMOTER),
  gameWinnerController.updateGameWinnerDetails,
);
router.patch(
  '/:gameWinnerId/toggle-prize-claim-status',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  gameWinnerController.togglePrizeClaimStatus,
);

router.delete(
  '/:gameWinnerId',
  authorize(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.PROMOTER),
  gameWinnerController.deleteGameWinner,
);

module.exports = router;
