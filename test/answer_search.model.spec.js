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

    const questionTests = new questionCommon.SpecTests(generator, hxQuestion);

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
});
