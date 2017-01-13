'use strict';

const _ = require('lodash');

const models = require('../../models');
const SPromise = require('../../lib/promise');

const surveys = require('./bhr-gap-surveys');
const Converter = require('../csv-converter');

const enumerations = [{
    name: 'yes-no-1-2',
    enumerals: [{ text: 'Yes', value: 1 }, { text: 'No', value: 2 }]
}, {
    name: 'weight-ranges-lbs',
    enumerals: [
        { text: '110-', value: 1 },
        { text: '110-119', value: 2 },
        { text: '120-129', value: 3 },
        { text: '130-139', value: 4 },
        { text: '140-149', value: 5 },
        { text: '150-159', value: 6 },
        { text: '160-169', value: 7 },
        { text: '170-179', value: 8 },
        { text: '180-189', value: 9 },
        { text: '190-199', value: 10 },
        { text: '200-209', value: 11 },
        { text: '210-219', value: 12 },
        { text: '220-229', value: 13 },
        { text: '230-239', value: 14 },
        { text: '240-249', value: 15 },
        { text: '250-259', value: 16 },
        { text: '260-269', value: 17 },
        { text: '270-279', value: 18 },
        { text: '280-289', value: 19 },
        { text: '290-299', value: 20 },
        { text: '300-309', value: 21 },
        { text: '310+', value: 22 }
    ]
}, {
    name: 'height-ft-inches',
    enumerals: _.range(4, 8).reduce((r, ft) => {
        _.range(0, 12).forEach(inches => r.push({ text: `${ft}'${inches}"`, value: r.length + 1 }));
        return r;
    }, [])
}, {
    name: 'marital-status',
    enumerals: [
        { text: 'Divorced', value: 1 },
        { text: 'Domestic Partner', value: 2 },
        { text: 'Married', value: 3 },
        { text: 'Separated', value: 4 },
        { text: 'Single', value: 5 },
        { text: 'Widowed', value: 6 }
    ]
}, {
    name: 'primary-residence-type',
    enumerals: [
        { text: 'House', value: 1 },
        { text: 'Condo/Co-op (owned)', value: 2 },
        { text: 'Apartment (rented)', value: 3 },
        { text: 'Mobile Home', value: 4 },
        { text: 'Retirement Community', value: 5 },
        { text: 'Assisted Living', value: 6 },
        { text: 'Skilled Nursing Facility', value: 7 },
        { text: 'Other', value: 8 }
    ]
}, {
    name: 'primary-occupation',
    enumerals: [
        { text: 'Agriculture, Forestry, Fishing, or Hunting', value: 1 },
        { text: 'Arts, Entertainment, or Recreation', value: 2 },
        { text: 'Broadcasting', value: 3 },
        { text: 'Education - College, University, or Adult', value: 4 },
        { text: 'Education - Primary/Secondary (K-12)', value: 5 },
        { text: 'Education - Other', value: 6 },
        { text: 'Construction', value: 7 },
        { text: 'Finance and Insurance', value: 8 },
        { text: 'Government and Public Administration', value: 9 },
        { text: 'Health Care and Social Assistance', value: 10 },
        { text: 'Homemaker', value: 11 },
        { text: 'Hotel and Food Services', value: 12 },
        { text: 'Information - Services and Data', value: 13 },
        { text: 'Information - Other', value: 14 },
        { text: 'Processing', value: 15 },
        { text: 'Legal Services', value: 16 },
        { text: 'Manufacturing - Computer and Electronics', value: 7 },
        { text: 'Manufacturing - Other', value: 18 },
        { text: 'Military', value: 19 },
        { text: 'Mining', value: 20 },
        { text: 'Publishing', value: 21 },
        { text: 'Real Estate, Rental, or Leasing', value: 22 },
        { text: 'Religious', value: 23 },
        { text: 'Retail', value: 24 },
        { text: 'Scientific or Technical Services', value: 25 },
        { text: 'Software', value: 26 },
        { text: 'Telecommunications', value: 27 },
        { text: 'Transportation and Warehousing', value: 28 },
        { text: 'Utilities', value: 29 },
        { text: 'Wholesale', value: 30 },
        { text: '*Other', value: 31 }
    ]
}, {
    name: 'retirement-year',
    enumerals: _.range(1950, 2017).map((year, index) => ({ text: `${year}`, value: index + 1 }))
}, {
    name: 'armed-forces-branch',
    enumerals: [
        { text: 'Air Force', value: 1 },
        { text: 'Army', value: 2 },
        { text: 'Coast Guard', value: 3 },
        { text: 'Marines', value: 4 },
        { text: 'National Guard', value: 5 },
        { text: 'Navy', value: 6 }
    ]
}];

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

const convertSubjects = function (filepath, surveyId) {
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
};

const valueConverterByChoiceType = {
    bool: function (value) {
        if (value === 1 || value === '1') {
            return 'true';
        }
    }
};

const valueConverterByType = {
    choices: function (value, choiceType) {
        const converter = valueConverterByChoiceType[choiceType];
        if (!converter) {
            throw new Error('Choice type ${choiceType} has not been implemented.');
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

const convertFileToRecords = function (filepath, survey_id, subjectMap, answerIdentifierType) {
    return models.answerIdentifier.getTypeInformationByAnswerIdentifier(answerIdentifierType)
        .then(identifierMap => {
            const converter = new Converter({ checkType: false });
            return converter.fileToRecords(filepath)
                .then(records => {
                    const assessmentKeys = new Set(['SubjectCode', 'Timepoint', 'DaysAfterBaseline', 'Latest', 'Status']);
                    const result = records.reduce((r, record) => {
                        const user_id = subjectMap.get(record.SubjectCode);
                        if (!user_id) {
                            throw new Error(`User identifier ${record.SubjectCode} is not recognized.`);
                        }
                        const assessmentName = record.Timepoint;
                        if (!assessmentName) {
                            throw new Error(`Line without assessment name found.`);
                        }
                        let assesmentInfo = r.get(assessmentName);
                        if (!assesmentInfo) {
                            assesmentInfo = { userAssessments: [] };
                            r.set(assessmentName, assesmentInfo);
                        }
                        let status = record.Status ? assessmentStatusMap[record.Status] : 'no-status';
                        if (!status) {
                            throw new Error(`Status ${record.Status} is not recognized.`);
                        }
                        assesmentInfo.userAssessments.push({ user_id, status });
                        if (record.Status === 'Collected') {
                            let assesmentAnswers = assesmentInfo.answers;
                            if (!assesmentAnswers) {
                                assesmentAnswers = [];
                                assesmentInfo.answers = assesmentAnswers;
                            }
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
                                        value = valueConverter(value, questionChoiceType);
                                        const element = { user_id, survey_id, question_id };
                                        if (question_choice_id) {
                                            element.question_choice_id = question_choice_id;
                                        }
                                        if (multiple_index || multiple_index === 0) {
                                            element.multiple_index = multiple_index;
                                        }
                                        if (value !== null) {
                                            element.value = value;
                                        }
                                        element.language_code = 'en';
                                        assesmentAnswers.push(element);
                                    }
                                }
                            });
                        }
                        return r;
                    }, new Map());
                    return result;
                });
        });
};

module.exports = {
    loadEnumerations,
    loadSurveys,
    convertSubjects,
    convertFileToRecords,
    surveys
};
