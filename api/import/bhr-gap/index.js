'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const queryrize = require('../../lib/queryrize');

const models = require('../../models');
const db = require('../../models/db');
const SPromise = require('../../lib/promise');

const surveys = require('./bhr-gap-surveys');
const Converter = require('../csv-converter');
const CSVConverterExport = require('../../export/csv-converter');

const enumerations = require('./enumerations');

const loadEnumerations = function () {
    const promises = enumerations.map(enumeration => {
        return models.enumeration.createEnumeration(enumeration);
    });
    return SPromise.all(promises);
};

const loadSurveys = function () {
    const promises = surveys.map(survey => {
        return models.survey.createSurvey(survey);
    });
    return SPromise.all(promises)
        .then(ids => models.profileSurvey.createProfileSurveyId(ids[0]));
};

const generateChoiceAnswerer = function (columnName, identifierMap, choiceMap) {
    const question_id = identifierMap.get(columnName);
    const choiceIdMap = choiceMap.get(question_id);
    return function (value, survey_id, username) {
        if (value) {
            const question_choice_id = choiceIdMap.get(value);
            if (!question_choice_id) {
                throw new Error('Unexpected value ${questionChoiceId} for ${columnName}.');
            }
            return [{ survey_id, question_id, question_choice_id, username }];
        }
    };
};

const generateChoicesAnswerer = function (columnName, identifierMap, choiceMap) {
    const question_id = identifierMap.get(columnName);
    const choiceIdMap = choiceMap.get(question_id);
    return function (semicolonValues, survey_id, username) {
        if (semicolonValues) {
            const values = semicolonValues.split(';');
            return values.map(value => {
                const question_choice_id = choiceIdMap.get(value);
                if (!question_choice_id) {
                    throw new Error('Unexpected value ${value} for ${columnName}.');
                }
                return { survey_id, question_id, question_choice_id, value: 'true', username };
            });
        }
    };
};

const generateIntegerAnswerer = function (columnName, identifierMap) {
    const question_id = identifierMap.get(columnName);
    return function (value, survey_id, username) {
        if (value !== undefined) {
            return [{ survey_id, question_id, value, username }];
        }
    };
};

const generateAnswerConverter = function (identifierMap, choiceMap) {
    const result = {};
    ['Gender', 'YearsEducation', 'Handedness'].forEach(columnName => {
        result[columnName] = generateChoiceAnswerer(columnName, identifierMap, choiceMap);
    });
    ['RaceEthnicity'].forEach(columnName => {
        result[columnName] = generateChoicesAnswerer(columnName, identifierMap, choiceMap);
    });
    ['Age_Baseline'].forEach(columnName => {
        result[columnName] = generateIntegerAnswerer(columnName, identifierMap);
    });
    return result;
};

const convertSubjects = function (filepath) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier('bhr-gap')
        .then(surveyIdentificaterMap => {
            const surveyId = surveyIdentificaterMap.get('subjects');
            return models.questionIdentifier.getIdsByQuestionIdentifier('bhr-gap-subjects-column')
                .then(identifierMap => {
                    const ids = [...identifierMap.values()];
                    return models.questionChoice.getAllQuestionChoices(ids)
                        .then(allChoices => {
                            const choiceMap = allChoices.reduce((r, choice) => {
                                const questionId = choice.questionId;
                                let perQuestion = r.get(questionId);
                                if (!perQuestion) {
                                    perQuestion = new Map();
                                    r.set(questionId, perQuestion);
                                }
                                perQuestion.set(choice.text, choice.id);
                                return r;
                            }, new Map());
                            return generateAnswerConverter(identifierMap, choiceMap);
                        });
                })
                .then(answerConverter => {
                    const converter = new Converter();
                    return converter.fileToRecords(filepath)
                        .then(records => {
                            const userRecords = records.map(record => {
                                const identifier = record.SubjectCode;
                                return {
                                    username: identifier,
                                    email: identifier + '@example.com',
                                    password: 'pwd',
                                    role: 'participant'
                                };
                            });
                            const answerRecords = records.reduce((r, record) => {
                                const username = record.SubjectCode;
                                ['Gender', 'YearsEducation', 'Handedness', 'RaceEthnicity', 'Age_Baseline'].forEach(key => {
                                    const value = record[key];
                                    const answer = answerConverter[key](value, surveyId, username);
                                    if (answer) {
                                        r.push(...answer);
                                    }
                                });
                                return r;
                            }, []);
                            return { userRecords, answerRecords };
                        });
                });
        });
};

const transformSubjectsFile = function (filepath, userFilepath) {
    return convertSubjects(filepath)
        .then(result => {
            const userConverter = new CSVConverterExport({ fields: ['username', 'email', 'password', 'role'] });
            fs.writeFileSync(userFilepath, userConverter.dataToCSV(result.userRecords));
            return result;
        });
};

const valueConverterByChoiceType = {
    bool: function (value) {
        if (value === 1 || value === '1') {
            return 'true';
        }
    },
    integer: function (value) {
        return parseInt(value);
    },
    float: function (value) {
        return parseFloat(value);
    },
    enumeration: function (value) {
        return parseInt(value);
    }
};

const valueConverterByType = {
    choices: function (value, choiceType) {
        const converter = valueConverterByChoiceType[choiceType];
        if (!converter) {
            throw new Error(`Choice type ${choiceType} has not been implemented.`);
        }
        return converter(value);
    },
    enumeration: function (value) {
        return parseInt(value);
    },
    text: function (value) {
        if (value.indexOf('\\') > -1) {
            value = value.replace(/\\/g, '\\\\');
        }
        return value;
    },
    integer: function (value) {
        return parseInt(value);
    },
    float: function (value) {
        return parseFloat(value);
    }
};

const assessmentStatusMap = {
    'Scheduled': 'scheduled',
    'Collected': 'collected',
    'Failed To Collect': 'failed-to-collect',
    'Not In Protocol': 'not-in-protocol',
    'Started': 'started',
    'Refused': 'refused',
    'Technical Difficulties': 'technical-difficulties',
    'Unable To Perform': 'unable-to-perform'
};

const transformSurveyFile = function (filepath, answerIdentifierType, outputFilepath) {
    return models.answerIdentifier.getTypeInformationByAnswerIdentifier(answerIdentifierType)
        .then(identifierMap => {
            const converter = new Converter({ checkType: false });
            return converter.fileToRecords(filepath)
                .then(records => {
                    const fields = ['username', 'assessment_name', 'status', 'line_index', 'question_id', 'question_choice_id', 'multiple_index', 'value', 'language_code', 'last_answer', 'days_after_baseline'];
                    const lastIndex = fields.length - 1;
                    const fileStream = fs.createWriteStream(outputFilepath);
                    fileStream.write(fields.join(','));
                    fileStream.write('\n');
                    const px = new SPromise((resolve, reject) => {
                        fileStream.on('finish', resolve);
                        fileStream.on('error', reject);
                        const handleLine = function(line) {
                            fields.forEach((field, index) => {
                                let value = line[field];
                                if (value !== undefined && value !== null) {
                                    value = value.toString();
                                    if (field === 'value') {
                                        value = value.replace(/\"/g, '""');
                                        fileStream.write(`"${value}"`);
                                    } else {
                                        fileStream.write(value);
                                    }
                                }
                                if (index !== lastIndex) {
                                    fileStream.write(',');
                                }
                            });
                            fileStream.write('\n');
                        };
                        const assessmentKeys = new Set(['SubjectCode', 'Timepoint', 'DaysAfterBaseline', 'Latest', 'Status']);
                        records.forEach((record, line_index) => {
                            if((line_index + 100) % 100 === 0) {
                                console.log(line_index);
                            }
                            const username = record.SubjectCode;
                            if (!username) {
                                throw new Error(`Subject code is missing on line ${line_index + 1}.`);
                            }
                            const assessment_name = record.Timepoint;
                            if (!assessment_name) {
                                throw new Error(`Assessment name is missing on line ${line_index + 1}.`);
                            }
                            const status = record.Status ? assessmentStatusMap[record.Status] : 'no-status';
                            if (!status) {
                                throw new Error(`Status ${record.Status} is not recognized.`);
                            }
                            const last_answer = record.Latest ? record.Latest.toLowerCase() === 'true' : false;
                            const baseObject = { username, assessment_name, status, line_index, last_answer };
                            if (record.DaysAfterBaseline) {
                                baseObject.days_after_baseline = record.DaysAfterBaseline;
                            }
                            let inserted = false;
                            _.forOwn(record, (value, key) => {
                                if (!assessmentKeys.has(key)) {
                                    const answerInformation = identifierMap.get(key);
                                    if (!answerInformation) {
                                        throw new Error(`Unexpected column name ${key} for ${answerIdentifierType}.`);
                                    }
                                    const { questionId: question_id, questionChoiceId: question_choice_id, multipleIndex: multiple_index, questionType, questionChoiceType } = answerInformation;
                                    if (value !== '' && value !== undefined) {
                                        const valueConverter = valueConverterByType[questionType];
                                        if (!valueConverter) {
                                            throw new Error(`Question type ${questionType} has not been implemented.`);
                                        }
                                        const answerValue = valueConverter(value, questionChoiceType);
                                        const answer = Object.assign({ question_id }, baseObject);
                                        if (question_choice_id) {
                                            answer.question_choice_id = question_choice_id;
                                        }
                                        if (multiple_index || multiple_index === 0) {
                                            answer.multiple_index = multiple_index;
                                        }
                                        if (answerValue !== null) {
                                            answer.value = answerValue;
                                        }
                                        answer.language_code = 'en';
                                        handleLine(answer);
                                        inserted = true;
                                    }
                                }
                            });
                            if (!inserted) {
                                handleLine(baseObject);
                            }
                        });
                        fileStream.end();
                    });
                    return px;
                });
        });
};

const importTransformedSurveyFile = function (tableIdentifier, filepath) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier('bhr-gap')
        .then(surveyIdentificaterMap => {
            const surveyId = surveyIdentificaterMap.get(tableIdentifier);
            const scriptPath = path.join(__dirname, '../../sql-scripts/bhr-gap-import.sql');
            const rawScript = queryrize.readFileSync(scriptPath);
            const parameters = {
                survey_id: surveyId,
                filepath: `'${filepath}'`,
                identifier: `'${tableIdentifier}'`
            };
            const script = rawScript.map(query => queryrize.replaceParameters(query, parameters));
            let promise = script.reduce((r, query) => {
                if (r === null) {
                    r = db.sequelize.query(query);
                } else {
                    r = r.then(() => db.sequelize.query(query));
                }
                return r;
            }, null);
            return promise;
        });
};

module.exports = {
    loadEnumerations,
    loadSurveys,
    convertSubjects,
    transformSubjectsFile,
    transformSurveyFile,
    importTransformedSurveyFile,
    surveys
};
