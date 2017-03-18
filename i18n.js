'use strict';

const path = require('path');
const i18n = require('i18n');

const logger = require('./logger');

i18n.configure({
    directory: path.join(__dirname, 'locales'),
    locales: ['en', 'es', 'fr', 'jp', 'ru'],
    defaultLocale: 'en',
    queryParameter: 'language',
    updateFiles: false,
    logDebugFn(msg) {
        logger.log('debug', msg);
    },
    logWarnFn(msg) {
        logger.log('warn', msg);
    },
    logErrorFn(msg) {
        logger.log('error', msg);
    },
});

module.exports = i18n;
