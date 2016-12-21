'use strict';

const db = require('../db');

const SPromise = require('../../lib/promise');

const sequelize = db.sequelize;
const Assessment = db.Assessment;
const AssessmentSurvey = db.AssessmentSurvey;

const createAssessmentSurveys = function (assessmentId, surveys, transaction) {
    const promises = surveys.map(({ id, lookback = false }) => {
        return AssessmentSurvey.create({ assessmentId, surveyId: id, lookback }, { transaction });
    });
    return SPromise.all(promises); // TODO: BulkCreate when Sequelize 4.
};

module.exports = class AssessmentDAO {
    constructor() {}

    createAssessment({ name, sequenceType = 'on-demand', surveys }) {
        return sequelize.transaction(transaction => {
            return Assessment.create({ name, sequenceType }, { transaction })
                .then(({ id }) => {
                    return createAssessmentSurveys(id, surveys, transaction)
                        .then(() => ({ id }));
                });
        });
    }

    getAssessment(id) {
        return Assessment.findById(id, { attributes: ['id', 'name', 'sequenceType'], raw: true })
            .then(assessment => {
                return AssessmentSurvey.findAll({
                        where: { assessmentId: id },
                        attributes: [
                            ['survey_id', 'id'], 'lookback'
                        ],
                        raw: true,
                    })
                    .then(surveys => {
                        assessment.surveys = surveys;
                        return assessment;
                    });
            });
    }

    listAssessments() {
        return Assessment.findAll({ raw: true, attributes: ['id', 'name'] });
    }
};
