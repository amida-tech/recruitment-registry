'use strict';

const RRError = require('../../lib/rr-error');

module.exports = class SurveyConsentDAO {
    constructor(db, dependencies) {
        Object.assign(this, dependencies);
        this.db = db;
    }

    createSurveyConsent({ surveyId, consentId, consentTypeId, action }) {
        const SurveyConsent = this.db.SurveyConsent;
        const ConsentSection = this.db.ConsentSection;
        if (!consentId) {
            return SurveyConsent.create({ surveyId, consentTypeId, action })
                .then(({ id }) => ({ id }));
        }
        return ConsentSection.count({ where: { consentId, typeId: consentTypeId } })
            .then((count) => {
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
        const Consent = this.db.Consent;
        return Consent.findAll({ raw: true, where: { id: { $in: consentIds } }, attributes: ['id', 'name'] })
            .then(consents => new Map(consents.map(consent => [consent.id, consent.name])))
            .then((consentMap) => {
                surveyConsents.forEach((surveyConsent) => {
                    const consentId = surveyConsent.consentId;
                    if (consentId) {
                        const consentName = consentMap.get(consentId);
                        surveyConsent.consentName = consentName;
                    }
                });
                return surveyConsents;
            });
    }

    listSurveyConsents(options) {
        const SurveyConsent = this.db.SurveyConsent;
        return SurveyConsent.findAll({ raw: true, attributes: ['id', 'consentId', 'consentTypeId', 'action'] })
            .then((surveyConsents) => {
                if (surveyConsents.length < 1) {
                    return surveyConsents;
                }
                surveyConsents.forEach(surveyConsent => (surveyConsent.consentId ? null : delete surveyConsent.consentId));
                const consentTypeIds = surveyConsents.map(({ consentTypeId }) => consentTypeId);
                const typeIdSet = new Set(consentTypeIds);
                const ids = [...typeIdSet];
                const typeOptions = Object.assign({ ids }, options);
                return this.consentType.listConsentTypes(typeOptions)
                    .then(consentTypes => new Map(consentTypes.map(consentType => [consentType.id, consentType])))
                    .then((consentTypeMap) => {
                        surveyConsents.forEach((surveyConsent) => {
                            const consentType = consentTypeMap.get(surveyConsent.consentTypeId);
                            surveyConsent.consentTypeName = consentType.name;
                            surveyConsent.consentTypeTitle = consentType.title;
                        });
                    })
                    .then(() => this.updateConsentsInSurveyConsents(surveyConsents));
            });
    }

    deleteSurveyConsent(id) {
        const SurveyConsent = this.db.SurveyConsent;
        return SurveyConsent.destroy({ where: { id } });
    }
};
