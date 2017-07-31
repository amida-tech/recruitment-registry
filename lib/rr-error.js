'use strict';

const SPromise = require('./promise');

const statusCodeMap = {
    surveyPublishedDelete: 409,
    surveyPublishedToDraftUpdate: 409,
    surveyDraftToRetiredUpdate: 403,
    surveyRetiredStatusUpdate: 409,
};

class RRError extends Error {
    constructor(code, ...params) {
        super(code);
        this.code = code;
        this.params = params;
        this.statusCode = statusCodeMap[code] || null;
    }

    getMessage(i18n) {
        const i18nParams = this.params.reduce((r, param, index) => {
            r[`$${index}`] = param;
            return r;
        }, {});
        const locale = i18n.locale;
        let msg = i18n.__({ phrase: this.code, locale }, i18nParams); // eslint-disable-line no-underscore-dangle, max-len
        if (msg === this.code && locale !== 'en') {
            msg = i18n.__({ phrase: this.code, locale: 'en' }, i18nParams); // eslint-disable-line no-underscore-dangle, max-len
        }
        if (msg === this.code) {
            msg = i18n.__({ phrase: 'unknown', locale }, i18nParams); // eslint-disable-line no-underscore-dangle, max-len
        }
        return msg;
    }

    static reject(code, ...params) {
        const err = new RRError(code, ...params);
        return SPromise.reject(err);
    }
}

module.exports = RRError;
