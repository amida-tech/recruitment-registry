'use strict';

const _ = require('lodash');

const Base = require('./base');

module.exports = class AssessmentDAO extends Base {
    createAssessmentSurveys(assessmentId, surveys, transaction) {
        const fn = ({ id }) => ({ assessmentId, surveyId: id });
        const records = surveys.map(fn);
        return this.db.AssessmentSurvey.bulkCreate(records, { transaction });
    }

    createAssessment({ name, surveys, group, stage = 0 }) {
        const Assessment = this.db.Assessment;
        const record = { name, stage };
        if (group) {
            record.group = group;
        }
        return this.transaction(transaction => Assessment.create(record, { transaction })
            .then(({ id }) => this.createAssessmentSurveys(id, surveys, transaction)
                .then(() => ({ id }))));
    }

    getAssessment(id) {
        const AssessmentSurvey = this.db.AssessmentSurvey;
        const Assessment = this.db.Assessment;
        return Assessment.findById(id, { attributes: ['id', 'name', 'stage', 'group'], raw: true })
            .then(assessment => _.omitBy(assessment, _.isNil))
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

    listAssessments(options = {}) {
        const Assessment = this.db.Assessment;
        const attributes = ['id', 'name', 'stage', 'group'];
        const findOptions = { raw: true, attributes };
        if (options.group) {
            findOptions.where = { group: options.group };
        }
        return Assessment.findAll(findOptions)
            .then(assessments => assessments.map(assessment => _.omitBy(assessment, _.isNil)));
    }
};
