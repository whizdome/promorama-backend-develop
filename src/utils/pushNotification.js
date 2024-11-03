const admin = require('firebase-admin');

const logger = require('./customLogger');

// Initialize firebase-admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

/**
 * @name sendPushNotification
 * @param {{title:string, body:string, tokens:string[]}} data
 * @returns {Promise<void>} void
 */
const sendPushNotification = async (data) => {
  logger.info(
    `[PushNotification]: Attempting to send the notification to ${data.tokens.length} devices.`,
  );

  try {
    const { failureCount, successCount } = await admin.messaging().sendEachForMulticast({
      tokens: data.tokens,
      notification: { title: data.title, body: data.body },
      android: { priority: 'high', ttl: 86400 * 1000 },
      apns: {
        headers: {
          'apns-expiration': `${Math.floor(Date.now() / 1000) + 86400}`,
          'apns-priority': '10',
        },
        payload: { aps: { contentAvailable: true } },
      },
    });
    logger.info(
      `[PushNotification]: Successfully sent the notification to ${successCount} devices (${failureCount} failed).`,
    );
  } catch (err) {
    logger.error(`[PushNotification]: ${err.message}`);
  }
};

/**
 * @name sendBatchPushNotification
 * @param {{title:string, body:string, tokens:string[]}} data
 * @returns {Promise<void>} void
 */
const sendBatchPushNotification = (data) => {
  // Maximum number of device tokens for push notifications at once
  const maxTokens = 500;

  // Total number of times to send push notification in batches
  let totalBatchNum = data.tokens.length / maxTokens;
  if (data.tokens.length % maxTokens !== 0) {
    totalBatchNum++;
  }

  // Convert totalBatchNum to integer
  totalBatchNum = Math.floor(totalBatchNum);

  // Send push notification in batches
  for (let i = 0; i < totalBatchNum; i++) {
    const start = i * maxTokens;
    const end = (i + 1) * maxTokens;
    const batchTokens = data.tokens.slice(start, end);
    sendPushNotification({ title: data.title, body: data.body, tokens: batchTokens });
  }
};

module.exports = { sendPushNotification, sendBatchPushNotification };
