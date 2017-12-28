'use strict';

const Sequelize = require('sequelize');
const Base = require('./base');

const Op = Sequelize.Op;

module.exports = class SectionDAO extends Base {
    listSurveySectionQuestions(surveySectionIds) {
        return this.db.SurveySectionQuestion.findAll({
            where: { surveySectionId: { [Op.in]: surveySectionIds } },
            attributes: ['surveySectionId', 'questionId'],
            raw: true,
            order: ['line'],
        });
    }

    groupSurveySectionQuestions(surveySectionIds) {
        return this.listSurveySectionQuestions(surveySectionIds)
            .then((surveySectionQuestions) => {
                const map = new Map(surveySectionIds.map(id => [id, []]));
                surveySectionQuestions.forEach(({ surveySectionId, questionId }) => {
                    const questions = map.get(surveySectionId);
                    questions.push(questionId);
                });
                return map;
            });
    }
};
