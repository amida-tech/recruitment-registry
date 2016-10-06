'use strict';

const Sequelize = require('sequelize');

const errors = {};

class RRError extends Error {
    constructor(code, ...params) {
        let error = errors[code];
        if (!error) {
            code = 'unknown';
            error = errors.unknown;
        }
        const msg = RRError.injectParams(error.msg, params);
        super(msg);
        this.code = code;
    }

    static reject(code, params) {
        const err = new RRError(code, params);
        return Sequelize.Promise.reject(err); // TODO: Change to ES6 Promise with Sequelize 4
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
        const msg = (errors[code] || errors.unknown).msg;
        return RRError.injectParams(msg, params);
    }

    toObject() {
        return {
            message: this.message,
            code: this.code
        };
    }
}

module.exports = RRError;

errors.unknown = {
    msg: 'Internal unknown error.'
};

errors.test = {
    msg: 'Testing.'
};

errors.testParams1 = {
    msg: 'Testing $0.'
};

errors.testParams2 = {
    msg: 'Testing $1 and $0 and $1.'
};

errors.qxCreateChoicesBoth = {
    msg: '\'oneOfChoices\' and \'choices\' cannot be specified simultaneously.'
};

errors.qxCreateChoicesNone = {
    msg: '\'choices\' was not specified for \'choices\' type question.'
};

errors.qxCreateChoiceNone = {
    msg: '\'oneOfChoices\' or \'choices\' was not specified for \'choice\' type question.'
};

errors.qxCreateChoiceNotBool = {
    msg: '\'choices\' can only be \'bool\' type for \'choice\' type question.'
};

errors.qxCreateChoicesOther = {
    msg: '\'choices\' or \'oneOfChoices\' cannot be specified for \'$0\' type question.'
};

errors.qxNotFound = {
    msg: 'No such question.'
};

errors.surveyNotFound = {
    msg: 'No such survey.'
};

errors.surveyNoQuestions = {
    msg: 'Surveys without questions are not accepted.'
};

errors.documentNoSystemDocuments = {
    msg: 'System does not have the required documents uploaded.'
};

errors.profileSignaturesMissing = {
    msg: 'Required document signatures are not included.'
};

errors.jsonSchemaFailed = {
    msg: 'JSON schema validation for $0 failed.'
};
