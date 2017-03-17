/* global __ */

'use strict';

const path = require('path');
const i18n = require('i18n');

const SPromise = require('./promise');
const logger = require('../logger');

i18n.configure({
    directory: path.join(__dirname, '../locales'),
    defaultLocale: 'en',
    register: global,
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

const statusCodeMap = {
    surveyPublishedToDraftUpdate: 409,
    surveyDraftToRetiredUpdate: 403,
    surveyRetiredStatusUpdate: 409,
};

class RRError extends Error {
    constructor(code, ...params) {
        const i18nParams = params.reduce((r, param, index) => {
            r[`$${index}`] = param;
            return r;
        }, {});
        let msg = __({ phrase: code, locale: 'en' }, i18nParams);
        if (msg === code) {
            code = 'unknown';
            msg = __({ phrase: 'unknown', locale: 'en' }, i18nParams);
        }
        super(msg);
        this.code = code;
        this.statusCode = statusCodeMap[code] || null;
    }

    static reject(code, ...params) {
        const err = new RRError(code, ...params);
        return SPromise.reject(err);
    }

    static message(code, ...params) {
        const i18nParams = params.reduce((r, param, index) => {
            r[`$${index}`] = param;
            return r;
        }, {});
        let msg = __({ phrase: code, locale: 'en' }, i18nParams);
        if (msg === code) {
            msg = __({ phrase: 'unknown', locale: 'en' }, i18nParams);
        }
        return msg;
    }

    toObject() {
        return {
            message: this.message,
            code: this.code,
        };
    }
}

module.exports = RRError;
