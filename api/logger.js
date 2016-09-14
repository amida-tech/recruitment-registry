'use strict';

const winston = require('winston');
const _ = require('lodash');

const config = require('./config');

if (config.logging.disable) {
    module.exports = {
        error: _.noop
    };
} else {
    module.exports = new(winston.Logger)({
        transports: [
            new winston.transports.Console({
                json: true,
                colorize: true
            })
        ],
        level: 'error'
    });
}
