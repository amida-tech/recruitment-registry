'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');

const SurveyIdentifier = db.SurveyIdentifier;

module.exports = class SurveyIdentifierDAO {
    createSurveyIdentifier(surveyIdentifier, transaction) {
        return SurveyIdentifier.create(surveyIdentifier, { transaction })
            .then(({ id }) => ({ id }));
    }

    getIdentifiersBySurveyId(type, ids) {
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
                surveys.forEach(survey => survey.identifier = identifierMap.get(survey.id));
                return surveys;
            });
    }

    getIdsBySurveyIdentifier(type) {
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
        return SurveyIdentifier.findOne({ where: { type, identifier }, raw: true, attributes: ['surveyId'] })
            .then((record) => {
                if (!record) {
                    return RRError.reject('surveyIdentifierNotFound', type, identifier);
                }
                return record.surveyId;
            });
    }
};
