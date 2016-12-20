const devConfig = require('./node_modules/mozilla-neo/config/webpack.dev');
devConfig.target = 'web';

require('dotenv').config();

module.exports = devConfig;
