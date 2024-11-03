const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const createDefaultAdmin = require('./helpers/createDefaultAdmin');
const socketIO = require('./helpers/socketIO');
// const redis = require('./helpers/redis');
const logger = require('./utils/customLogger');
// const { initiativeWeeklyReportCron } = require('./helpers/initiativeWeeklyReportCron');
const { initiativesMessagesReportCron } = require('./helpers/initiativesMessagesReportCron');

/* Listen for uncaught exception event */
process.on('uncaughtException', (err) => {
  logger.error(`[UnhandledException]: ${err}`);
  process.exit(1);
});

/* Load environment variables into Node.js process */
dotenv.config();

/* Express application */
const app = require('./app');

/* Connect to MongoDB */
mongoose
  .connect(process.env.MONGO_URI)
  .then((db) => {
    logger.info(`[MongoDB connected]: ${db.connection.host}`);
    createDefaultAdmin();

    // initiativeWeeklyReportCron.start();
    initiativesMessagesReportCron.start();
  })
  .catch((err) => {
    logger.error(`[Unable to connect to MongoDB]: ${err.message}`);
    process.exit(1);
  });

/* Connect to REDIS */
// redis
//   .connect()
//   .then(() => {
//     logger.info('Client connected to REDIS');

//     // Listen for closed connection (via .quit() or .disconnect())
//     redis.client.on('end', () => {
//       logger.info('Client disconnected from REDIS');
//       process.exit();
//     });

//     // Listen for interrupt signals
//     process.on('SIGINT', () => redis.client.quit());
//   })
//   .catch((err) => {
//     logger.error('Client could not connect to REDIS:', err.message);
//     process.exit(1);
//   });

/* Initialize socket.io */
const httpServer = http.createServer(app);
const io = socketIO.init(httpServer);

io.on('connection', (socket) => {
  socketIO.socketHandler(socket);
});

/* Listen for incoming requests */
const port = process.env.PORT || 3000;
const server = httpServer.listen(port, () =>
  logger.info(`Listening on port ${port} in ${process.env.NODE_ENV} mode.`),
);

/* Listen for unhandled promise rejection event */
process.on('unhandledRejection', (err) => {
  logger.error(`[UnhandledRejection]: ${err}`);
  server.close(() => {
    process.exit(1);
  });
});

/* Listen for termination signal event */
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED! Shutting down...');
  server.close(() => {
    logger.info('Process terminated!');
  });
});
