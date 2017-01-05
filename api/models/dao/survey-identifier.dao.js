'use strict';

const db = require('../db');

const SurveyIdentifier = db.SurveyIdentifier;

module.exports = class QuestionIdentifierDAO {
    constructor() {}

    getIdentifiersBySurveyId(type, ids) {
        return SurveyIdentifier.findAll({
                where: { type, id: { $in: ids } },
                attributes: ['surveyId', 'identifier'],
                raw: true
            })
            .then(records => {
                const map = records.map(({ surveyId, identifier }) => [surveyId, identifier]);
                return new Map(map);
            });
    }

    updateSurveysWithIdentifier(surveys, type) {
        const ids = surveys.map(survey => survey.id);
        return this.getIdentifiersBySurveyId(type, ids)
            .then(identifierMap => {
                surveys.forEach(survey => survey.identifier = identifierMap.get(survey.id));
                return surveys;
            });
    }

    getIdsBySurveyIdentifier(type) {
        return SurveyIdentifier.findAll({
                where: { type },
                attributes: ['surveyId', 'identifier'],
                raw: true
            })
            .then(records => {
                const map = records.map(({ surveyId, identifier }) => [identifier, surveyId]);
                return new Map(map);
            });
    }
};
