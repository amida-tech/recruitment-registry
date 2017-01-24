'use strict';

const path = require('path');
const fs = require('fs');
const csvToJson = require('csvtojson');
const _ = require('lodash');

const config = require('../../config');
const queryrize = require('../../lib/queryrize');
const models = require('../../models');
const db = require('../../models/db');
const SPromise = require('../../lib/promise');

const Converter = require('../csv-converter');
const CSVConverterExport = require('../../export/csv-converter');

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

const SurveyCSVConverter = class SurveyCSVConverter {
    constructor(identifierMap, answerIdentifierType) {
        this.assessmentKeys = new Set(['SubjectCode', 'Timepoint', 'DaysAfterBaseline', 'Latest', 'Status']);
        this.identifierMap = identifierMap;
        this.answerIdentifierType = answerIdentifierType;
        this.fields = ['username', 'assessment_name', 'status', 'line_index', 'question_id', 'question_choice_id', 'multiple_index', 'value', 'language_code', 'last_answer', 'days_after_baseline'];

    }

    handleLine(fileStream, line) {
        const lastIndex = this.fields.length - 1;
        this.fields.forEach((field, index) => {
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
    }

    jsonHandler(outputStream, record, line_index) {
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
            if (!this.assessmentKeys.has(key)) {
                const answerInformation = this.identifierMap.get(key);
                if (!answerInformation) {
                    throw new Error(`Unexpected column name ${key} for ${this.answerIdentifierType}.`);
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
                    this.handleLine(outputStream, answer);
                    inserted = true;
                }
            }
        });
        if (!inserted) {
            this.handleLine(outputStream, baseObject);
        }
    }

    streamToRecords(stream, outputStream) {
        outputStream.write(this.fields.join(','));
        outputStream.write('\n');
        const converter = new csvToJson.Converter({ checkType: false, constructResult: false });
        const px = new SPromise((resolve, reject) => {
            converter.on('end', () => {
                outputStream.end();
            });
            converter.on('error', reject);
            if (this.jsonHandler) {
                converter.on('json', (json, rowIndex) => {
                    this.jsonHandler(outputStream, json, rowIndex);
                });
            }
            outputStream.on('finish', resolve);
            outputStream.on('error', reject);
        });
        stream.pipe(converter);
        return px;
    }

    convert(filepath, outputFilepath) {
        const stream = fs.createReadStream(filepath);
        const outputStream = fs.createWriteStream(outputFilepath);
        return this.streamToRecords(stream, outputStream);
    }
};

const generateChoiceAnswerer = function (question_id, columnName, choiceMap) {
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

const generateChoicesAnswerer = function (question_id, columnName, choiceMap) {
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

const generateIntegerAnswerer = function (question_id) {
    return function (value, survey_id, username) {
        if (value !== undefined) {
            return [{ survey_id, question_id, value, username }];
        }
    };
};

const generateAnswerConverter = function (identifierMap, choiceMap) {
    const result = {};
    identifierMap.forEach((questionInfo, identifier) => {
        const questionId = questionInfo.id;
        const type = questionInfo.type;
        if (type === 'integer') {
            result[identifier] = generateIntegerAnswerer(questionId);
            return;
        }
        if (type === 'choice') {
            result[identifier] = generateChoiceAnswerer(questionId, identifier, choiceMap);
            return;
        }
        if (type === 'choices') {
            result[identifier] = generateChoicesAnswerer(questionId, identifier, choiceMap);
            return;
        }
    });
    return result;
};

const convertSubjects = function (filepath, { surveyIdentifier, questionIdentifierType, subjectCode }) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(surveyIdentifier.type)
        .then(surveyIdentificaterMap => {
            const surveyId = surveyIdentificaterMap.get(surveyIdentifier.value);
            return models.questionIdentifier.getInformationByQuestionIdentifier(questionIdentifierType)
                .then(identifierMap => {
                    const ids = [...identifierMap.values()].map(info => info.id);
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
                                const identifier = record[subjectCode];
                                return {
                                    username: identifier,
                                    email: `${identifier}@example.com`,
                                    password: 'pwd',
                                    role: 'participant'
                                };
                            });
                            const answerRecords = records.reduce((r, record) => {
                                const username = record[subjectCode];
                                _.forOwn(record, (value, key) => {
                                    if ((key !== subjectCode) && (value !== undefined)) {
                                        const answer = answerConverter[key](value, surveyId, username);
                                        if (answer) {
                                            r.push(...answer);
                                        }
                                    }
                                });
                                return r;
                            }, []);
                            return { userRecords, answerRecords };
                        });
                });
        });
};

const importSubjects = function (filepath, options) {
    const basename = path.basename(filepath, '.csv');
    const userFilepath = path.join(config.tmpDirectory, `${basename}-trans-user.csv`);
    const answerFilepath = path.join(config.tmpDirectory, `${basename}-trans-answer.csv`);
    return convertSubjects(filepath, options)
        .then(result => {
            const userConverter = new CSVConverterExport({ fields: ['username', 'email', 'password', 'role'] });
            fs.writeFileSync(userFilepath, userConverter.dataToCSV(result.userRecords));
            return result;
        })
        .then(subjectsData => {
            const query = 'copy registry_user (username, email, password, role) from :filepath csv header';
            return db.sequelize.query(query, { replacements: { filepath: userFilepath } })
                .then(() => db.sequelize.query('select id, username from registry_user', { type: db.sequelize.QueryTypes.SELECT }))
                .then(users => {
                    const subjectMap = new Map();
                    users.forEach(({ id, username }) => subjectMap.set(username, id));
                    return subjectMap;
                })
                .then(subjectMap => {
                    const subjectAnswers = subjectsData.answerRecords.map(r => {
                        r.user_id = subjectMap.get(r.username);
                        delete r.username;
                        r.language_code = 'en';
                        return r;
                    });
                    const answerConverter = new CSVConverterExport({ fields: ['user_id', 'survey_id', 'question_id', 'question_choice_id', 'value', 'language_code'] });
                    fs.writeFileSync(answerFilepath, answerConverter.dataToCSV(subjectAnswers));
                })
                .then(() => {
                    const query = 'copy answer (user_id, survey_id, question_id, question_choice_id, value, language_code) from :filepath csv header';
                    return db.sequelize.query(query, { replacements: { filepath: answerFilepath } });
                });
        });

};

const transformSurveyFile = function (filepath, answerIdentifierType, outputFilepath) {
    return models.answerIdentifier.getTypeInformationByAnswerIdentifier(answerIdentifierType)
        .then(identifierMap => {
            const converter = new SurveyCSVConverter(identifierMap, answerIdentifierType);
            return converter.convert(filepath, outputFilepath);
        });
};

const importTransformedSurveyFile = function (surveyIdentifier, filepath) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(surveyIdentifier.type)
        .then(surveyIdentificaterMap => {
            const surveyId = surveyIdentificaterMap.get(surveyIdentifier.value);
            const scriptPath = path.join(__dirname, '../../sql-scripts/bhr-gap-import.sql');
            const rawScript = queryrize.readFileSync(scriptPath);
            const parameters = {
                survey_id: surveyId,
                filepath: `'${filepath}'`,
                identifier: `'${surveyIdentifier.value}'`
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
    importSubjects,
    transformSurveyFile,
    importTransformedSurveyFile
};
