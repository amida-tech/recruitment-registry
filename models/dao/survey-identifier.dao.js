'use strict';

const Base = require('./base');
const RRError = require('../../lib/rr-error');

module.exports = class SurveyIdentifierDAO extends Base {
    createSurveyIdentifier(surveyIdentifier, transaction) {
        const SurveyIdentifier = this.db.SurveyIdentifier;
        return SurveyIdentifier.create(surveyIdentifier, { transaction })
            .then(({ id }) => ({ id }));
    }

    getIdentifiersBySurveyId(type, ids) {
        const SurveyIdentifier = this.db.SurveyIdentifier;
        return SurveyIdentifier.findAll({
            where: { type, id: { $in: ids } },
            attributes: ['surveyId', 'identifier'],
            raw: true,
        })
            .then((records) => {
                const map = records.map(({ surveyId, identifier }) => [surveyId, identifier]);
                return new Map(map);
            });
    }

    updateSurveysWithIdentifier(surveys, type) {
        const ids = surveys.map(survey => survey.id);
        return this.getIdentifiersBySurveyId(type, ids)
            .then((identifierMap) => {
                surveys.forEach((survey) => { survey.identifier = identifierMap.get(survey.id); });
                return surveys;
            });
    }

    getIdsBySurveyIdentifier(type) {
        const SurveyIdentifier = this.db.SurveyIdentifier;
        return SurveyIdentifier.findAll({
            where: { type },
            attributes: ['surveyId', 'identifier'],
            raw: true,
        })
            .then((records) => {
                const map = records.map(({ surveyId, identifier }) => [identifier, surveyId]);
                return new Map(map);
            });
    }

    getIdBySurveyIdentifier(type, identifier) {
        const SurveyIdentifier = this.db.SurveyIdentifier;
        return SurveyIdentifier.findOne({ where: { type, identifier }, raw: true, attributes: ['surveyId'] })
            .then((record) => {
                if (!record) {
                    return RRError.reject('surveyIdentifierNotFound', type, identifier);
                }
                return record.surveyId;
            });
    }
};
