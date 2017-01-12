'use strict';

const models = require('../models');
const db = require('../models/db');

const assessmentStatusMap = {
    'scheduled': 'Scheduled',
    'collected': 'Collected',
    'failed-to-collect': 'Failed To Collect',
    'not-in-protocol': 'Not In Protocol',
    'started': 'Started',
    'refused': 'Refused',
    'technical-difficulties': 'Technical Difficulties',
    'unable-to-perform': 'Unable To Perform'
};

const exportTableData = function (surveyType, answerType) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier('bhr-gap')
        .then(surveyIdentificaterMap => {
            const surveyId = surveyIdentificaterMap.get(surveyType);
            return models.answerIdentifier.getIdentifiersByAnswerIds(answerType)
                .then(({ map: identifierMap, identifiers: valueColumns }) => {
                    const query = `select answer.question_id, question.type as question_type, question.multiple, answer.multiple_index, answer.question_choice_id, question_choice.type as choice_type, answer.value, assessment.name as assessment_name, registry_user.username from answer left join user_assessment_answer on user_assessment_answer.answer_id = answer.id left join user_assessment on user_assessment.id = user_assessment_answer.user_assessment_id left join assessment on user_assessment.assessment_id = assessment.id left join registry_user on registry_user.id = answer.user_id left join question on question.id = answer.question_id left join question_choice on question_choice.id = answer.question_choice_id where answer.survey_id = ${surveyId} order by answer.id`;
                    return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT })
                        .then(collectedRecords => {
                            return collectedRecords.reduce((r, record) => {
                                const columnIdentifier = identifierMap.get(record.question_id);
                                if (columnIdentifier === undefined) {
                                    throw new Error(`No identifier is found for question id ${record.question_id}`);
                                }
                                let columnName;
                                if (record.multiple) {
                                    columnName = columnIdentifier.get(record.multiple_index);
                                } else if (record.question_type === 'choices') {
                                    columnName = columnIdentifier.get(record.question_choice_id);
                                } else {
                                    columnName = columnIdentifier;
                                }
                                if (!columnName) {
                                    throw new Error(`Column name is not found for question id ${record.question_id}`);
                                }
                                const assessmentName = record.assessment_name;
                                const timePoint = assessmentName && assessmentName.split(`${surveyType}-`)[1];
                                if (!timePoint) {
                                    throw new Error(`Unexpected assessment name for ${assessmentName}.`);
                                }
                                const subjectCode = record.username;
                                if (!subjectCode) {
                                    throw new Error('No user found.');
                                }
                                const key = `${subjectCode}-${timePoint}`;
                                if (!r[key]) {
                                    r[key] = { SubjectCode: subjectCode, Timepoint: timePoint, Status: 'Collected' };
                                }
                                let value = record.value;
                                if (record.question_type === 'bool' || record.choice_type === 'bool' || record.choice_type === 'bool-sole') {
                                    if (value === 'true') {
                                        value = '1';
                                    }
                                }
                                r[key][columnName] = value;
                                return r;
                            }, {});
                        })
                        .then(output => {
                            const query = `select user_assessment.status, registry_user.username, assessment.name as assessment_name from user_assessment left join registry_user on registry_user.id = user_assessment.user_id left join assessment on user_assessment.assessment_id = assessment.id where user_assessment.assessment_id in (select assessment_id from assessment_survey where assessment_survey.survey_id = ${surveyId})`;
                            return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT })
                                .then(notCollectedRecords => {
                                    notCollectedRecords.forEach(record => {
                                        const assessmentName = record.assessment_name;
                                        const timePoint = assessmentName && assessmentName.split(`${surveyType}-`)[1];
                                        if (!timePoint) {
                                            throw new Error(`Unexpected assessment name for ${assessmentName}.`);
                                        }
                                        const subjectCode = record.username;
                                        if (!subjectCode) {
                                            throw new Error('No user found.');
                                        }
                                        const key = `${subjectCode}-${timePoint}`;
                                        if (!output[key]) {
                                            output[key] = { SubjectCode: subjectCode, Timepoint: timePoint, Status: assessmentStatusMap[record.status] };
                                        }
                                    });
                                    const keys = Object.keys(output);
                                    keys.sort();
                                    valueColumns.sort();
                                    const columns = ['SubjectCode', 'Timepoint', 'Status', ...valueColumns];
                                    return { columns, rows: keys.map(key => output[key]) };
                                });
                        });
                });
        });
};

module.exports = {
    exportTableData
};
