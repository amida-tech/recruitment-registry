'use strict';

const models = require('../models');
const SPromise = require('../lib/promise');

const enumerations = require('./bhr-gap-enumerations');
const surveys = require('./bhr-gap-surveys');
const Converter = require('./csv-converter');

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

module.exports = {
    loadEnumerations,
    loadSurveys,
    convertSubjects
};
