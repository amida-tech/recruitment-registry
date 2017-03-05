'use strict';

const winston = require('winston');

const config = require('./config');

module.exports = new (winston.Logger)({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true,
        }),
    ],
    level: config.logging.level,
});
