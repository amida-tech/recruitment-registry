'use strict';

const Sequelize = require('sequelize');
const Base = require('./base');

const Op = Sequelize.Op;

module.exports = class SurveyIdentifierDAO extends Base {
    createSurveyIdentifier(surveyIdentifier, transaction) {
        const SurveyIdentifier = this.db.SurveyIdentifier;
        return SurveyIdentifier.create(surveyIdentifier, { transaction })
            .then(({ id }) => ({ id }));
    }

    getIdentifiersBySurveyId(type, ids) {
        const SurveyIdentifier = this.db.SurveyIdentifier;
        return SurveyIdentifier.findAll({
            where: { type, id: { [Op.in]: ids } },
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
                surveys.forEach((r) => { r.identifier = identifierMap.get(r.id); });
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
};
