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
        let msg = __({ phrase: code, locale: 'en' });
        if (msg === code) {
            code = 'unknown';
            msg = __({ phrase: 'unknown', locale: 'en' });
        }
        msg = RRError.injectParams(msg, params);
        super(msg);
        this.code = code;
        this.statusCode = statusCodeMap[code] || null;
    }

    static reject(code, ...params) {
        const err = new RRError(code, ...params);
        return SPromise.reject(err);
    }

    static injectParams(msg, params) {
        if (params.length) {
            params.forEach((param, index) => {
                const expr = `\\$${index}`;
                const re = new RegExp(expr, 'g');
                msg = msg.replace(re, param);
            });
        }
        return msg;
    }

    static message(code, ...params) {
        let msg = __({ phrase: code, locale: 'en' });
        if (msg === code) {
            msg = __({ phrase: 'unknown', locale: 'en' });
        }
        return RRError.injectParams(msg, params);
    }

    toObject() {
        return {
            message: this.message,
            code: this.code,
        };
    }
}

module.exports = RRError;
