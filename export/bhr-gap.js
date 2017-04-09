'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const fs = require('fs');
const _ = require('lodash');

const models = require('../models');
const queryrize = require('../lib/queryrize');
const CSVConverterExport = require('../export/csv-converter');

const exportTableScript = queryrize.readQuerySync('bhr-gap-export.sql');
const exportSubjectsScript = queryrize.readQuerySync('bhr-gap-subject-export.sql');

const sequelize = models.sequelize;

const assessmentStatusMap = {
    scheduled: 'Scheduled',
    collected: 'Collected',
    'failed-to-collect': 'Failed To Collect',
    'not-in-protocol': 'Not In Protocol',
    started: 'Started',
    refused: 'Refused',
    'technical-difficulties': 'Technical Difficulties',
    'unable-to-perform': 'Unable To Perform',
};

const exportSubjectsData = function ({ surveyIdentifier, questionIdentifierType, subjectCode }) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(surveyIdentifier.type)
        .then((surveyIdentificaterMap) => {
            const surveyId = surveyIdentificaterMap.get(surveyIdentifier.value);
            const replacements = { survey_id: surveyId };
            return sequelize.query(exportSubjectsScript, { type: sequelize.QueryTypes.SELECT, replacements })
                .then(subjects => models.questionIdentifier.getInformationByQuestionId(questionIdentifierType)
                        .then((identifierMap) => {
                            const result = subjects.reduce((r, subject) => {
                                const username = subject.username;
                                let record = r.get(username);
                                if (!record) {
                                    record = {
                                        [subjectCode]: username,
                                    };
                                    r.set(username, record);
                                }
                                const { identifier, type } = identifierMap[subject.question_id];
                                if (type === 'choices') {
                                    let value = record[identifier];
                                    if (value) {
                                        value = `${value};${subject.value}`;
                                    } else {
                                        value = subject.value;
                                    }
                                    record[identifier] = value;
                                } else {
                                    record[identifier] = subject.value;
                                }
                                return r;
                            }, new Map());
                            const questionColumns = _.values(identifierMap).map(r => r.identifier);
                            const columns = [subjectCode, ...questionColumns];
                            const rows = [...result.values()];
                            return { rows, columns };
                        }));
        });
};

const writeSubjectsData = function (filepath, options) {
    return exportSubjectsData(options)
        .then(({ columns, rows }) => {
            const converter = new CSVConverterExport({ fields: columns });
            if (options.order) {
                rows = _.sortBy(rows, options.order);
            }
            fs.writeFileSync(filepath, converter.dataToCSV(rows));
            return { columns, rows };
        });
};

const exportTableData = function ({ type, value: surveyType }, answerType) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(type)
        .then((surveyIdentificaterMap) => {
            const surveyId = surveyIdentificaterMap.get(surveyType);
            return models.answerIdentifier.getIdentifiersByAnswerIds(answerType)
                .then(({ map: identifierMap, identifiers: valueColumns }) => {
                    const replacements = { survey_id: surveyId };
                    return sequelize.query(exportTableScript, { type: sequelize.QueryTypes.SELECT, replacements })
                        .then(collectedRecords => collectedRecords.reduce((r, record) => {
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
                                r[key] = { SubjectCode: subjectCode, Timepoint: timePoint, Status: assessmentStatusMap[record.status], Latest: lastAnswer };
                                const daysAfterBaseline = record.days_after_baseline;
                                if (daysAfterBaseline !== null) {
                                    r[key].DaysAfterBaseline = daysAfterBaseline.toString();
                                }
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
                        }, {}))
                        .then((rows) => {
                            valueColumns.sort();
                            const columns = ['SubjectCode', 'Timepoint', 'DaysAfterBaseline', 'Latest', 'Status', ...valueColumns];
                            return { columns, rows };
                        });
                });
        });
};

const writeTableData = function (surveyIdentifier, answerType, filepath, order) {
    return exportTableData(surveyIdentifier, answerType)
        .then(({ columns, rows }) => {
            const converter = new CSVConverterExport({ fields: columns });
            if (order) {
                rows = _.sortBy(rows, order);
            }
            fs.writeFileSync(filepath, converter.dataToCSV(rows));
            return { columns, rows };
        });
};

module.exports = {
    exportSubjectsData,
    writeSubjectsData,
    exportTableData,
    writeTableData,
};
