const redis = require('redis');

// const logger = require('../utils/customLogger');

let client;

module.exports = {
  // Expose the redis client instance
  get client() {
    if (!client) throw new Error('Cannot access REDIS before connecting');
    return client;
  },

  // Connect to Redis
  connect() {
    client = redis.createClient();

    return new Promise((resolve, reject) => {
      client.connect();
      client.on('connect', () => resolve());
      client.on('error', (err) => reject(err));
    });
  },
};
