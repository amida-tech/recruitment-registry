/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const answerCommon = require('./util/answer-common');
const questionCommon = require('./util/question-common');

const QuestionGenerator = require('./util/generator/question-generator');
const MultiQuestionGenerator = require('./util/generator/multi-question-generator');
const SurveyGenerator = require('./util/generator/survey-generator');

describe('answer search unit', function answerSearchUnit() {
    const expect = chai.expect;
    const generator = new Generator();
    const shared = new SharedSpec(generator);

    const hxUser = new History();
    const hxSurvey = new SurveyHistory();
    const hxQuestion = new History();

    const answerTests = new answerCommon.SpecTests(generator, hxUser, hxSurvey, hxQuestion);
    const questionTests = new questionCommon.SpecTests(generator, hxQuestion);
    const hxAnswers = answerTests.hxAnswer;

    const questionGenerator = new QuestionGenerator();
    const multiQuestionGenerator = new MultiQuestionGenerator();
    const surveyGenerator = new SurveyGenerator();

    before(shared.setUpFn());

    _.range(5).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
    });

    const offset = 5;
    const surveyCount = 4;

    _.range(offset).forEach((index) => {
        it(`create question ${index}`, questionTests.createQuestionFn());
        it(`get question ${index}`, questionTests.getQuestionFn(index));
    });

    const typeIndexMap = new Map();
    const types = [];
    const questions = [];
    ['choice', 'choices', 'text', 'bool'].forEach((type) => {
        const options = { choiceCount: 6, noText: true, noOneOf: true };
        types.push(type);
        const indices = [];
        typeIndexMap.set(type, indices);
        _.range(surveyCount).forEach(() => {
            indices.push(offset + questions.length);
            const question = questionGenerator.newQuestion(type, options);
            questions.push(question);
        });
    });
    ['choice', 'text', 'bool'].forEach((type) => {
        const options = { choiceCount: 6, noOneOf: true, max: 5 };
        const multiType = `multi${type}`;
        types.push(multiType);
        const indices = [];
        typeIndexMap.set(multiType, indices);
        _.range(surveyCount).forEach(() => {
            indices.push(offset + questions.length);
            const question = multiQuestionGenerator.newMultiQuestion(type, options);
            questions.push(question);
        });
    });

    questions.forEach((question, index) => {
        const actualIndex = offset + index;
        it(`create question ${actualIndex}`, questionTests.createQuestionFn(question));
        it(`get question ${actualIndex}`, questionTests.getQuestionFn(actualIndex));
    });

    const choiceIdMap = new Map();
    it('create a map of all choice/choice question choices', function generateChoiceMap() {
        ['choice', 'choices', 'multichoice'].forEach((type) => {
            const questionIndices = typeIndexMap.get(type);
            questionIndices.forEach((questionIndex) => {
                const question = hxQuestion.server(questionIndex);
                const choices = question.choices;
                expect(choices).to.have.length.above(0);
                const questionChoiceIds = [];
                choiceIdMap.set(question.id, questionChoiceIds);
                choices.forEach((choice) => {
                    const choiceType = choice.type;
                    if (choiceType !== 'text') {
                        const choiceId = choice.id;
                        questionChoiceIds.push(choiceId);
                    }
                });
                expect(questionChoiceIds).to.have.length.above(5);
            });
        });
    });

    const createSurveyFn = function (qxIndices) {
        return function () {
            const survey = surveyGenerator.newBody();
            survey.questions = qxIndices.map(index => ({
                id: hxQuestion.server(index).id,
                required: false,
            }));
            return models.survey.createSurvey(survey)
                .then((id) => {
                    hxSurvey.push(survey, { id });
                });
        };
    };

    _.range(surveyCount).forEach((index) => {
        const qxIndices = types.map(type => typeIndexMap.get(type)[index]);
        it(`create survey ${index}`, createSurveyFn(qxIndices));
    });

    const answerGenerators = {
        text(questionId, spec) {
            return { answer: { textValue: spec.value } };
        },
        bool(questionId, spec) {
            return { answer: { boolValue: spec.value } };
        },
        choice(questionId, spec) {
            const choiceIds = choiceIdMap.get(questionId);
            const choice = choiceIds[spec.choiceIndex];
            return { answer: { choice } };
        },
        choices(questionId, spec) {
            const choiceIds = choiceIdMap.get(questionId);
            const choices = spec.choiceIndices.map(choiceIndex => choiceIds[choiceIndex]);
            return { answer: { choices } };
        },
        multitext(questionId, spec) {
            const values = spec.values;
            const fn = (textValue, multipleIndex) => ({ textValue, multipleIndex });
            const answers = values.map(fn);
            return { answers };
        },
        multibool(questionId, spec) {
            const values = spec.values;
            const fn = (boolValue, multipleIndex) => ({ boolValue, multipleIndex });
            const answers = values.map(fn);
            return { answers };
        },
        multichoice(questionId, spec) {
            const choiceIds = choiceIdMap.get(questionId);
            const fn = (index, multipleIndex) => ({ choice: choiceIds[index], multipleIndex });
            const answers = spec.choiceIndices.map(fn);
            return { answers };
        }
    };

    const answerInfoToObject = function(surveyIndex, answerInfo, idProperty = 'questionId') {
        return answerInfo.map((info) => {
            const questionType = info.questionType;
            const questionIndex = typeIndexMap.get(questionType)[surveyIndex];
            const questionId = hxQuestion.id(questionIndex);
            const answerGenerator = answerGenerators[questionType];
            const answerObject = answerGenerator(questionId, info);
            return Object.assign({ [idProperty]: questionId }, answerObject);
        });
    };

    const createAnswersFn = function(userIndex, surveyIndex, answerInfo) {
        return function createAnswers() {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            const answers = answerInfoToObject(surveyIndex, answerInfo);
            const input = { userId, surveyId, answers };
            return models.answer.createAnswers(input)
                .then(() => hxAnswers.push(userIndex, surveyIndex, answers));
        };
    };

    const answerSequence = [{ // user 0, survey 0
        userIndex: 0,
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_00'
        }, {
            questionType: 'bool',
            value: true
        }, {
            questionType: 'choice',
            choiceIndex: 4
        }, {
            questionType: 'multitext',
            values: ['mtv_1', 'mtv_2']
        }]
    }, {                      // user 0, survey 1
        userIndex: 0,
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_10'
        }, {
            questionType: 'bool',
            value: false
        }, {
            questionType: 'choice',
            choiceIndex: 3
        }, {
            questionType: 'multichoice',
            choiceIndices: [2, 3, 4]
        }]
    }, {                      // user 0, survey 2
        userIndex: 0,
        surveyIndex: 2,
        answerInfo: [{
            questionType: 'multichoice',
            choiceIndices: [1, 3, 5]
        }, {
            questionType: 'choices',
            choiceIndices: [0, 2, 4]
        }]
    }, {                      // user 1, survey 0
        userIndex: 1,
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_00'
        }, {
            questionType: 'bool',
            value: false
        }, {
            questionType: 'choice',
            choiceIndex: 2
        }, {
            questionType: 'multitext',
            values: ['mtv_1']
        }]
    }, {                      // user 1, survey 1
        userIndex: 1,
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_102'
        }, {
            questionType: 'bool',
            value: false
        }, {
            questionType: 'choice',
            choiceIndex: 3
        }, {
            questionType: 'multichoice',
            choiceIndices: [1, 3]
        }]
    }, {                      // user 1, survey 2
        userIndex: 1,
        surveyIndex: 2,
        answerInfo: [{
            questionType: 'text',
            value: 'rm2'
        }, {
            questionType: 'choices',
            choiceIndices: [0, 2, 3]
        }, {
            questionType: 'multichoice',
            choiceIndices: [1, 2]
        }]
    }, {                      // user 2, survey 0
        userIndex: 2,
        surveyIndex: 0,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_00'
        }, {
            questionType: 'bool',
            value: false
        }, {
            questionType: 'choice',
            choiceIndex: 5
        }, {
            questionType: 'multitext',
            values: ['mtv_42', 'mtv_33', 'mtv_5']
        }]
    }, {                      // user 2, survey 1
        userIndex: 2,
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_102'
        }, {
            questionType: 'bool',
            value: true
        }, {
            questionType: 'choice',
            choiceIndex: 0
        }, {
            questionType: 'multichoice',
            choiceIndices: [1, 2, 4]
        }]
    }, {                      // user 2, survey 2
        userIndex: 2,
        surveyIndex: 2,
        answerInfo: [{
            questionType: 'text',
            value: 'rm4'
        }, {
            questionType: 'choices',
            choiceIndices: [0, 1]
        }, {
            questionType: 'multichoice',
            choiceIndices: [2, 5]
        }]
    }, {                      // user 3, survey 1
        userIndex: 3,
        surveyIndex: 1,
        answerInfo: [{
            questionType: 'text',
            value: 'textvalue_102'
        }, {
            questionType: 'bool',
            value: true
        }, {
            questionType: 'choice',
            choiceIndex: 0
        }, {
            questionType: 'multichoice',
            choiceIndices: [1, 4, 5]
        }]
    }, {                      // user 3, survey 2
        userIndex: 3,
        surveyIndex: 2,
        answerInfo: [{
            questionType: 'text',
            value: 'rm4'
        }, {
            questionType: 'choices',
            choiceIndices: [1, 4, 5]
        }, {
            questionType: 'multichoice',
            choiceIndices: [2, 4]
        }]
    }];

    answerSequence.forEach(({ userIndex, surveyIndex, answerInfo}) => {
        const msg = `user ${userIndex} answers survey ${surveyIndex}`;
        it(msg, createAnswersFn(userIndex, surveyIndex, answerInfo));
    });

    const searchCases = [{
        count: 3,
        answers: [{
            surveyIndex: 0,
            answerInfo: [{
                questionType: 'text',
                value: 'textvalue_00'
            }],
        }, {
            surveyIndex: 1,
            answerInfo: [{
                questionType: 'multichoice',
                choiceIndices: [2, 3]
            }]
        }]
    }, {
        count: 2,
        answers: [{
            surveyIndex: 0,
            answerInfo: [{
                questionType: 'text',
                value: 'textvalue_00'
            }],
        }, {
            surveyIndex: 1,
            answerInfo: [{
                questionType: 'multichoice',
                choiceIndices: [2]
            }]
        }]
    }, {
        count: 0,
        answers: [{
            surveyIndex: 0,
            answerInfo: [{
                questionType: 'text',
                value: 'notanexistinganswer'
            }],
        }, {
            surveyIndex: 1,
            answerInfo: [{
                questionType: 'multichoice',
                choiceIndices: [2, 3]
            }]
        }]
    }];

    const searchAnswersFn = function ({ count, answers }) {
        return function searchAnswers() {
            const questions = answers.reduce((r, { surveyIndex, answerInfo }) => {
                const answers = answerInfoToObject(surveyIndex, answerInfo, 'id');
                r.push(...answers);
                return r;
            }, []);
            const criteria = { questions };
            return models.answer.searchCountUsers(criteria)
                .then((actual) => expect(actual).to.equal(count));
        };
    };

    searchCases.forEach((searchCase, index) => {
        it(`search case ${index}`, searchAnswersFn(searchCase));
    });
});
