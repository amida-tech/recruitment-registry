'use strict';

const db = require('../db');

const SurveySectionQuestion = db.SurveySectionQuestion;

module.exports = class SectionDAO {
    listSurveySectionQuestions(surveySectionIds) {
        return SurveySectionQuestion.findAll({
            where: { surveySectionId: { $in: surveySectionIds } },
            attributes: ['surveySectionId', 'questionId'],
            raw: true,
            order: 'line',
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
