'use strict';

const models = require('../models');
const db = require('../models/db');
const queryrize = require('../lib/queryrize');

const rawExportTableScript = queryrize.readQuerySync('bhr-gap-export.sql');

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
                    const parameters = {
                        survey_id: surveyId
                    };
                    const query = queryrize.replaceParameters(rawExportTableScript, parameters);
                    return db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT })
                        .then(collectedRecords => {
                            return collectedRecords.reduce((r, record) => {
                                const key = record.user_assessment_id;
                                if (!r[key]) {
                                    const assessmentName = record.assessment_name;
                                    const timePoint = assessmentName && assessmentName.split(`${surveyType}-`)[1];
                                    if (!timePoint) {
                                        throw new Error(`Unexpected assessment name for ${assessmentName}.`);
                                    }
                                    const subjectCode = record.username;
                                    if (!subjectCode) {
                                        throw new Error('No user found.');
                                    }
                                    const lastAnswer = record.last_answer ? 'True' : 'False';
                                    const daysAfterBaseline = record.days_after_baseline.toString();
                                    r[key] = { SubjectCode: subjectCode, Timepoint: timePoint, DaysAfterBaseline: daysAfterBaseline, Status: assessmentStatusMap[record.status], Latest: lastAnswer };
                                }
                                if (record.question_id) {
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
                                    let value = record.value;
                                    if (record.question_type === 'bool' || record.choice_type === 'bool' || record.choice_type === 'bool-sole') {
                                        if (value === 'true') {
                                            value = '1';
                                        }
                                    }
                                    r[key][columnName] = value;
                                }
                                return r;
                            }, {});
                        })
                        .then(rows => {
                            valueColumns.sort();
                            const columns = ['SubjectCode', 'Timepoint', 'DaysAfterBaseline', 'Latest', 'Status', ...valueColumns];
                            return { columns, rows };
                        });
                });
        });
};

module.exports = {
    exportTableData
};
