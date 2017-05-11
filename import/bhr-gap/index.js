'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const path = require('path');
const fs = require('fs');
const csvToJson = require('csvtojson');
const _ = require('lodash');

const config = require('../../config');
const queryrize = require('../../lib/queryrize');
const models = require('../../models');
const SPromise = require('../../lib/promise');

const Converter = require('../csv-converter');
const CSVConverterExport = require('../../export/csv-converter');

const sequelize = models.sequelize;
const importSurveyScript = queryrize.readFileSync('bhr-gap-import.sql');

const valueConverterByChoiceType = {
    bool(value) {
        if (value === 1 || value === '1') {
            return 'true';
        }
        return undefined;
    },
};

const valueConverterByType = {
    choices(value, choiceType) {
        const converter = valueConverterByChoiceType[choiceType];
        if (!converter) {
            throw new Error(`Choice type ${choiceType} has not been implemented.`);
        }
        return converter(value);
    },
    'choice-ref': function (value) {
        return parseInt(value, 10);
    },
    text(value) {
        if (value.indexOf('\\') > -1) {
            value = value.replace(/\\/g, '\\\\');
        }
        return value;
    },
    integer(value) {
        return parseInt(value, 10);
    },
    float(value) {
        return parseFloat(value);
    },
};

const assessmentStatusMap = {
    Scheduled: 'scheduled',
    Collected: 'collected',
    'Failed To Collect': 'failed-to-collect',
    'Not In Protocol': 'not-in-protocol',
    Started: 'started',
    Refused: 'refused',
    'Technical Difficulties': 'technical-difficulties',
    'Unable To Perform': 'unable-to-perform',
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
                    value = value.replace(/\"/g, '""');  // eslint-disable-line no-useless-escape
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

    jsonHandler(outputStream, record, lineIndex) {
        const username = record.SubjectCode;
        if (!username) {
            throw new Error(`Subject code is missing on line ${lineIndex + 1}.`);
        }
        const assessmentName = record.Timepoint;
        if (!assessmentName) {
            throw new Error(`Assessment name is missing on line ${lineIndex + 1}.`);
        }
        const status = record.Status ? assessmentStatusMap[record.Status] : 'no-status';
        if (!status) {
            throw new Error(`Status ${record.Status} is not recognized.`);
        }
        const lastAnswer = record.Latest ? record.Latest.toLowerCase() === 'true' : false;
        const baseObject = { username, assessment_name: assessmentName, status, line_index: lineIndex, last_answer: lastAnswer };
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
                const { questionId, questionChoiceId, multipleIndex, questionType, questionChoiceType } = answerInformation;
                if (value !== '' && value !== undefined) {
                    const valueConverter = valueConverterByType[questionType];
                    if (!valueConverter) {
                        throw new Error(`Question type ${questionType} has not been implemented.`);
                    }
                    const answerValue = valueConverter(value, questionChoiceType);
                    const answer = Object.assign({ question_id: questionId }, baseObject);
                    if (questionChoiceId) {
                        answer.question_choice_id = questionChoiceId;
                    }
                    if (multipleIndex || multipleIndex === 0) {
                        answer.multiple_index = multipleIndex;
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

const generateChoiceAnswerer = function (questionId, columnName, choiceMap) {
    const choiceIdMap = choiceMap.get(questionId);
    return function fnGenerateChoiceAnswerer(value, surveyId, username) {
        if (value) {
            const questionChoiceId = choiceIdMap.get(value);
            if (!questionChoiceId) {
                throw new Error(`Unexpected value ${value} for ${columnName}.`);
            }
            return [{ survey_id: surveyId, question_id: questionId, question_choice_id: questionChoiceId, username }];
        }
        return undefined;
    };
};

const generateChoicesAnswerer = function (questionId, columnName, choiceMap) {
    const choiceIdMap = choiceMap.get(questionId);
    return function fnGenerateChoicesAnswerer(semicolonValues, surveyId, username) {
        if (semicolonValues) {
            const values = semicolonValues.split(';');
            return values.map((value) => {
                const questionChoiceId = choiceIdMap.get(value);
                if (!questionChoiceId) {
                    throw new Error(`Unexpected value ${value} for ${columnName}.`);
                }
                return { survey_id: surveyId, question_id: questionId, question_choice_id: questionChoiceId, value: 'true', username };
            });
        }
        return undefined;
    };
};

const generateIntegerAnswerer = function (questionId) {
    return function fnGenerateIntegerAnswerer(value, surveyId, username) {
        if (value !== undefined) {
            return [{ survey_id: surveyId, question_id: questionId, value, username }];
        }
        return undefined;
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
        }
    });
    return result;
};

const convertSubjects = function (filepath, { surveyIdentifier, questionIdentifierType, subjectCode }) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(surveyIdentifier.type)
        .then((surveyIdentificaterMap) => {
            const surveyId = surveyIdentificaterMap.get(surveyIdentifier.value);
            return models.questionIdentifier.getInformationByQuestionIdentifier(questionIdentifierType)
                .then((identifierMap) => {
                    const ids = [...identifierMap.values()].map(info => info.id);
                    return models.questionChoice.getAllQuestionChoices(ids)
                        .then((allChoices) => {
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
                .then((answerConverter) => {
                    const converter = new Converter();
                    return converter.fileToRecords(filepath)
                        .then((records) => {
                            const userRecords = records.map((record) => {
                                const identifier = record[subjectCode];
                                return {
                                    username: identifier,
                                    email: `${identifier}@example.com`,
                                    password: 'pwd',
                                    role: 'import',
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
        .then((result) => {
            const userConverter = new CSVConverterExport({ fields: ['username', 'email', 'password', 'role'] });
            fs.writeFileSync(userFilepath, userConverter.dataToCSV(result.userRecords));
            return result;
        })
        .then((subjectsData) => {
            const query = 'copy registry_user (username, email, password, role) from :filepath csv header';
            return sequelize.query(query, { replacements: { filepath: userFilepath } })
                .then(() => sequelize.query('select id, username from registry_user', { type: sequelize.QueryTypes.SELECT }))
                .then((users) => {
                    const subjectMap = new Map();
                    users.forEach(({ id, username }) => subjectMap.set(username, id));
                    return subjectMap;
                })
                .then((subjectMap) => {
                    const subjectAnswers = subjectsData.answerRecords.map((r) => {
                        r.user_id = subjectMap.get(r.username);
                        delete r.username;
                        r.language_code = 'en';
                        return r;
                    });
                    const answerConverter = new CSVConverterExport({ fields: ['user_id', 'survey_id', 'question_id', 'question_choice_id', 'value', 'language_code'] });
                    fs.writeFileSync(answerFilepath, answerConverter.dataToCSV(subjectAnswers));
                })
                .then(() => {
                    const query2 = 'copy answer (user_id, survey_id, question_id, question_choice_id, value, language_code) from :filepath csv header';
                    return sequelize.query(query2, { replacements: { filepath: answerFilepath } });
                });
        });
};

const transformSurveyFile = function (filepath, answerIdentifierType, outputFilepath) {
    return models.answerIdentifier.getTypeInformationByAnswerIdentifier(answerIdentifierType)
        .then((identifierMap) => {
            const converter = new SurveyCSVConverter(identifierMap, answerIdentifierType);
            return converter.convert(filepath, outputFilepath);
        });
};

const importTransformedSurveyFile = function (surveyIdentifier, filepath) {
    return models.surveyIdentifier.getIdsBySurveyIdentifier(surveyIdentifier.type)
        .then((surveyIdentificaterMap) => {
            const surveyId = surveyIdentificaterMap.get(surveyIdentifier.value);
            const replacements = {
                survey_id: surveyId,
                filepath,
                identifier: `${surveyIdentifier.value}`,
            };
            const promise = importSurveyScript.reduce((r, query) => {
                if (r === null) {
                    r = sequelize.query(query, { replacements });
                } else {
                    r = r.then(() => sequelize.query(query, { replacements }));
                }
                return r;
            }, null);
            return promise;
        });
};

module.exports = {
    importSubjects,
    transformSurveyFile,
    importTransformedSurveyFile,
};
