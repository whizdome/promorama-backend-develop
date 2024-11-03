const express = require('express');
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cron = require('node-cron');
// const rateLimit = require('express-rate-limit');

/* Route files */
const authRouter = require('./routes/auth.routes');
const storeRouter = require('./routes/store.routes');
const clientRouter = require('./routes/client.routes');
const employeeRouter = require('./routes/employee.routes');
const initiativeRouter = require('./routes/initiative.routes');
const initiativeStoreRouter = require('./routes/initiativeStore.routes');
const adminRouter = require('./routes/admin.routes');
const attendanceRouter = require('./routes/attendance.routes');
const shelfAndPosmRouter = require('./routes/shelfAndPosm.routes');
const inventoryRouter = require('./routes/inventory.routes');
const saleRouter = require('./routes/sale.routes');
const competitorRouter = require('./routes/competitor.routes');
const reportRouter = require('./routes/report.routes');
const taskRouter = require('./routes/task.routes');
const routeTrackerRouter = require('./routes/routeTracker.routes');
const notificationRouter = require('./routes/notification.routes');
const storeCategoryRouter = require('./routes/storeCategory.routes');
const supportRouter = require('./routes/support.routes');
const gameCategoryRouter = require('./routes/gameCategory.routes');
const gameWinnerRouter = require('./routes/gameWinner.routes');
const priceCheckRouter = require('./routes/priceCheck.routes');
const agencyRouter = require('./routes/agency.routes');
const storeInventoryRouter = require('./routes/storeInventory.routes');
const shipmentRouter = require('./routes/shipment.routes');
const surveyRouter = require('./routes/survey.routes');
const subuserRouter = require('./routes/subuser.routes');
const surveyResponseRouter = require('./routes/surveyResponse.routes');
const orderRouter = require('./routes/order.routes');
const paymentRouter = require('./routes/payment.routes');
const messageRouter = require('./routes/message.routes');
const mustStockListRouter = require('./routes/mustStockList.routes');
const shareOfShelfRouter = require('./routes/shareOfShelf.routes');
const initiativeStoresReportRouter = require('./routes/initiativeStoresReport.routes');
const appDataRouter = require('./routes/appData.routes');

/* Middleware */
const { globalErrorHandler, unhandledRoutes } = require('./middleware/error.middleware');
const { techSupportTicketRouter } = require('./routes/techSupportTickets.routes');
const { periodicMailRouter } = require('./routes/periodicMail.routes');
const { weeklyMail, monthlyMail } = require('./controllers/periodicMail.controller');
const { dataTableRouter } = require('./routes/dataTable.routes');

/* Express app */
const app = express();

/* Enable CORS */
app.use(cors());
app.options('*', cors());

/* Parse the request body */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* Set security HTTP headers */
app.use(helmet());

/* Request rate limiting */
// const limiter = rateLimit({
//   max: 100, // Limit each IP to 100 requests per `window` (here, per 5 minutes)
//   windowMs: 5 * 60 * 1000,
//   message: 'Too many requests from this IP. Please try again after 5 minutes.',
// });
// app.use('/api', limiter);

/* Data sanitization against NoSQL query injection */
app.use(mongoSanitize());

/* Data sanitization against XSS */
app.use(xss());

/* Prevent HTTP parameter pollution */
app.use(hpp());

/* Compress response body */
app.use(compression());

/* Mount routers */
app.get('/', (req, res) => res.status(200).send('Server is up and running!!!'));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/stores', storeRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/initiatives', initiativeRouter);
app.use('/api/v1/initiative-stores', initiativeStoreRouter);
app.use('/api/v1/admins', adminRouter);
app.use('/api/v1/attendances', attendanceRouter);
app.use('/api/v1/shelf-and-posm', shelfAndPosmRouter);
app.use('/api/v1/inventories', inventoryRouter);
app.use('/api/v1/sales', saleRouter);
app.use('/api/v1/competitors', competitorRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/route-trackers', routeTrackerRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/store-categories', storeCategoryRouter);
app.use('/api/v1/support', supportRouter);
app.use('/api/v1/game-categories', gameCategoryRouter);
app.use('/api/v1/game-winners', gameWinnerRouter);
app.use('/api/v1/price-checks', priceCheckRouter);
app.use('/api/v1/agencies', agencyRouter);
app.use('/api/v1/store-inventories', storeInventoryRouter);
app.use('/api/v1/shipments', shipmentRouter);
app.use('/api/v1/surveys', surveyRouter);
app.use('/api/v1/subusers', subuserRouter);
app.use('/api/v1/survey-responses', surveyResponseRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/msl', mustStockListRouter);
app.use('/api/v1/sos', shareOfShelfRouter);
app.use('/api/v1/initiative-stores-reports', initiativeStoresReportRouter);
app.use('/api/v1/app-data', appDataRouter);

// ------------->Tobbey<------------------
app.use('/api/v1/tech-support-ticket', techSupportTicketRouter);
app.use('/api/v1/periodic-mail', periodicMailRouter);
app.use('/api/v1/data-table', dataTableRouter);

app.use(unhandledRoutes);
app.use(globalErrorHandler);

cron.schedule('59 23 * * 0', weeklyMail); // every sunday
cron.schedule('59 23 28-31 * *', monthlyMail); // last day of the month

module.exports = app;
