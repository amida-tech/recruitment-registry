'use strict';

const SPromise = require('.//promise');

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

errors.qxNotFound = {
    msg: 'No such question.'
};

errors.surveyNotFound = {
    msg: 'No such survey.'
};

errors.surveyNoQuestions = {
    msg: 'Surveys without questions are not accepted.'
};

errors.noSystemConsentDocuments = {
    msg: 'System does not have the required consent sections uploaded.'
};

errors.profileSignaturesMissing = {
    msg: 'Required consent section signatures are not included.'
};

errors.jsonSchemaFailed = {
    msg: 'JSON schema validation for $0 failed.'
};

errors.registryNoProfileSurvey = {
    msg: 'No profile survey has been specified for the registry.'
};

errors.answerRequiredMissing = {
    msg: 'Not all required questions are answered.'
};

errors.answerQxNotInSurvey = {
    msg: 'Invalid question ids for answers.'
};

errors.qxReplaceWhenActiveSurveys = {
    msg: 'Question in active surveys cannot be removed or replaced.'
};

errors.consentTypeNotFound = {
    msg: 'No such consent type.'
};

errors.consentTypeDeleteOnConsent = {
    msg: 'Consent type cannot be removed because it is used by one or more consents.'
};

errors.smtpNotSpecified = {
    msg: 'Smtp specifications are not specified.'
};

errors.smtpTextNotSpecified = {
    msg: 'Email content and/or subject not specified for reset token.'
};

errors.surveyConsentInvalidTypeForConsent = {
    msg: 'Consent does not exists or does not include the Consent Type as section.'
};

errors.invalidOrExpiredPWToken = {
    msg: 'Password reset token is invalid or has expired.'
};

errors.invalidEmail = {
    msg: 'Email is invalid.'
};

errors.authenticationError = {
    msg: 'Authentication error.'
};

errors.uniqueUsername = {
    msg: 'The specified username is already in use.'
};

errors.uniqueEmail = {
    msg: 'The specified email address is already in use.'
};

errors.userIdenticalUsernameEmail = {
    msg: 'Username and email cannot be specified and identical.  Do not specify username to use email as username.'
};

errors.userNoUsernameChange = {
    msg: 'Username cannot be changed directly when email is being used as the username.'
};

errors.answerMultipleTypeAnswers = {
    msg: 'Multiple answer value keys: $0.'
};

errors.answerAnswerNotUnderstood = {
    msg: 'Unknown answer value key: $0.'
};

errors.surveySkipChoiceForNonChoice = {
    msg: 'Skip rule choice specified for non choice/choices question.'

};

errors.surveySkipChoiceNotFound = {
    msg: 'Skip rule choice is not found.'
};

errors.questionIdentifierNotFound = {
    msg: 'No such question identifier is found.'
};

errors.answerIdentifierNotFound = {
    msg: 'No such answer identifier is found.'
};

errors.surveyNoIdentifier = {
    msg: 'No identifiers founds for some surveys.'
};

errors.ccfInconsistentAnswerForType = {
    msg: 'Inconsistent answer ($1) specified for the question type $0.'
};

errors.ccfMultipleSelectionsForChoice = {
    msg: 'Multiple selections are specified choice type question.'
};

errors.ccfNoSelectionsForChoice = {
    msg: 'No selection is specified choice type question.'
};
