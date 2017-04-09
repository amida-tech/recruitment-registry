'use strict';

const Base = require('./base');

module.exports = class AssessmentDAO extends Base {
    createAssessmentSurveys(assessmentId, surveys, transaction) {
        const fn = ({ id, lookback = false }) => ({ assessmentId, surveyId: id, lookback });
        const records = surveys.map(fn);
        return this.db.AssessmentSurvey.bulkCreate(records, { transaction });
    }

    createAssessment({ name, sequenceType = 'ondemand', surveys }) {
        const Assessment = this.db.Assessment;
        const record = { name, sequenceType };
        return this.transaction(transaction => Assessment.create(record, { transaction })
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
                    assessment.surveys = surveys; // eslint-disable-line no-param-reassign
                    return assessment;
                }));
    }

    listAssessments() {
        const Assessment = this.db.Assessment;
        return Assessment.findAll({ raw: true, attributes: ['id', 'name'] });
    }
};
