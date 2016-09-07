const configFile = require('./config');

const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

module.exports = configFile[env];
