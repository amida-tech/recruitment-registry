'use strict';

const _ = require('lodash');

const Base = require('./base');

module.exports = class SurveyConsentDocumentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    listSurveyConsentDocuments({ userId, surveyId, action }, inputOptions, tx) {
        const query = {
            where: { surveyId, action },
            raw: true,
            attributes: ['consentId', 'consentTypeId'],
        };
        if (tx) {
            query.transaction = tx;
        }
        return this.db.SurveyConsent.findAll(query)
            .then(surveyConsents => this.surveyConsent.updateConsentsInSurveyConsents(surveyConsents))
            .then((surveyConsents) => {
                if (surveyConsents.length < 1) {
                    return surveyConsents;
                }
                const typeIds = _.map(surveyConsents, 'consentTypeId');
                const options = { typeIds, keepTypeId: true };
                if (tx) {
                    options.transaction = tx;
                }
                if (inputOptions.detail) {
                    options.summary = false;
                }
                if (inputOptions.language) {
                    options.language = inputOptions.language;
                }
                return this.userConsentDocument.listUserConsentDocuments(userId, options)
                    .then((docs) => {
                        const typeIdMap = _.keyBy(surveyConsents, 'consentTypeId');
                        docs.forEach((doc) => {
                            const surveyConsent = typeIdMap[doc.typeId];
                            if (surveyConsent.consentId) {
                                doc.consentId = surveyConsent.consentId;
                                doc.consentName = surveyConsent.consentName;
                            }
                            delete doc.updateComment;
                            delete doc.type;
                            delete doc.typeId;
                        });
                        return docs;
                    });
            });
    }
};
