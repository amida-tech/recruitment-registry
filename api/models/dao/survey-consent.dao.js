'use strict';

const db = require('../db');

const RRError = require('../../lib/rr-error');

const SurveyConsent = db.SurveyConsent;
const ConsentSection = db.ConsentSection;
const Consent = db.Consent;

module.exports = class SurveyConsentDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createSurveyConsent({ surveyId, consentId, consentTypeId, action }) {
        if (!consentId) {
            return SurveyConsent.create({ surveyId, consentTypeId, action })
                .then(({ id }) => ({ id }));
        }
        return ConsentSection.count({ where: { consentId, typeId: consentTypeId } })
            .then(count => {
                if (count) {
                    return SurveyConsent.create({ surveyId, consentId, consentTypeId, action })
                        .then(({ id }) => ({ id }));
                }
                return RRError.reject('surveyConsentInvalidTypeForConsent');
            });
    }

    updateConsentsInSurveyConsents(surveyConsents) {
        if (surveyConsents.length < 1) {
            return surveyConsents;
        }
        const consentIds = surveyConsents.reduce((r, { consentId }) => {
            if (consentId) {
                r.push(consentId);
            }
            return r;
        }, []);
        return Consent.findAll({ raw: true, id: { $in: consentIds }, attributes: ['id', 'name'] })
            .then(consents => new Map(consents.map(consent => [consent.id, consent.name])))
            .then(consentMap => {
                surveyConsents.forEach(surveyConsent => {
                    const consentId = surveyConsent.consentId;
                    if (consentId) {
                        const consentName = consentMap.get(consentId);
                        surveyConsent.consentName = consentName;
                    }
                });
                return surveyConsents;
            });
    }

    listSurveyConsents(surveyId, options) {
        return SurveyConsent.findAll({ surveyId, raw: true, attributes: ['id', 'consentId', 'consentTypeId', 'action'] })
            .then(surveyConsents => {
                if (surveyConsents.length < 1) {
                    return surveyConsents;
                }
                surveyConsents.forEach(surveyConsent => surveyConsent.consentId ? null : delete surveyConsent.consentId);
                const consentTypeIds = surveyConsents.map(({ consentTypeId }) => consentTypeId);
                const typeIdSet = new Set(consentTypeIds);
                const ids = [...typeIdSet];
                const typeOptions = Object.assign({ ids }, options);
                return this.consentType.listConsentTypes(typeOptions)
                    .then(consentTypes => new Map(consentTypes.map(consentType => [consentType.id, consentType])))
                    .then(consentTypeMap => {
                        surveyConsents.forEach(surveyConsent => {
                            const consentType = consentTypeMap.get(surveyConsent.consentTypeId);
                            surveyConsent.consentTypeName = consentType.name;
                            surveyConsent.consentTypeTitle = consentType.title;
                        });
                    })
                    .then(() => this.updateConsentsInSurveyConsents(surveyConsents));
            });
    }

    deleteSurveyConsent(id) {
        return SurveyConsent.destroy({ where: { id } });
    }
};
