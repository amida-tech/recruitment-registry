'use strict';

module.exports = class SectionDAO {
    constructor(db) {
        this.db = db;
    }

    listSurveySectionQuestions(surveySectionIds) {
        return this.db.SurveySectionQuestion.findAll({
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
