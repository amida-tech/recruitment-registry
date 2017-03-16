'use strict';

const SPromise = require('../../lib/promise');

module.exports = class AssessmentDAO {
    constructor(db) {
        this.db = db;
    }

    createAssessmentSurveys(assessmentId, surveys, transaction) {
        const AssessmentSurvey = this.db.AssessmentSurvey;
        const promises = surveys.map(({ id, lookback = false }) => AssessmentSurvey.create({ assessmentId, surveyId: id, lookback }, { transaction }));
        return SPromise.all(promises); // TODO: BulkCreate when Sequelize 4.
    }

    createAssessment({ name, sequenceType = 'ondemand', surveys }) {
        const Assessment = this.db.Assessment;
        return this.db.sequelize.transaction(transaction => Assessment.create({ name, sequenceType }, { transaction })
                .then(({ id }) => this.createAssessmentSurveys(id, surveys, transaction)
                        .then(() => ({ id }))));
    }

    getAssessment(id) {
        const AssessmentSurvey = this.db.AssessmentSurvey;
        const Assessment = this.db.Assessment;
        return Assessment.findById(id, { attributes: ['id', 'name', 'sequenceType'], raw: true })
            .then(assessment => AssessmentSurvey.findAll({
                where: { assessmentId: id },
                attributes: [
                            ['survey_id', 'id'], 'lookback',
                ],
                raw: true,
            })
                    .then((surveys) => {
                        assessment.surveys = surveys;
                        return assessment;
                    }));
    }

    listAssessments() {
        const Assessment = this.db.Assessment;
        return Assessment.findAll({ raw: true, attributes: ['id', 'name'] });
    }
};
