'use strict';

const Base = require('./base');

module.exports = class AssessmentDAO extends Base {
    createAssessmentSurveys(assessmentId, surveys, transaction) {
        const fn = ({ id }) => ({ assessmentId, surveyId: id });
        const records = surveys.map(fn);
        return this.db.AssessmentSurvey.bulkCreate(records, { transaction });
    }

    createAssessment({ name, surveys, stage = 0 }) {
        const Assessment = this.db.Assessment;
        const record = { name, stage };
        return this.transaction(transaction => Assessment.create(record, { transaction })
            .then(({ id }) => this.createAssessmentSurveys(id, surveys, transaction)
                .then(() => ({ id }))));
    }

    getAssessment(id) {
        const AssessmentSurvey = this.db.AssessmentSurvey;
        const Assessment = this.db.Assessment;
        return Assessment.findById(id, { attributes: ['id', 'name', 'stage'], raw: true })
            .then((assessment) => {
                const px = AssessmentSurvey.findAll({
                    where: { assessmentId: id },
                    attributes: [['survey_id', 'id']],
                    raw: true,
                });
                return px.then(surveys => Object.assign(assessment, { surveys }));
            });
    }

    deleteAssessmentTx(id, transaction) {
        const AssessmentSurvey = this.db.AssessmentSurvey;
        const Assessment = this.db.Assessment;
        return AssessmentSurvey.destroy({ where: { assessmentId: id }, transaction })
            .then(() => Assessment.destroy({ where: { id }, transaction }));
    }

    deleteAssessment(id) {
        return this.transaction(tx => this.deleteAssessmentTx(id, tx));
    }

    listAssessments() {
        const Assessment = this.db.Assessment;
        return Assessment.findAll({ raw: true, attributes: ['id', 'name', 'stage'] });
    }
};
