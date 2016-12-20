/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const Answerer = require('./util/generator/answerer');
const QuestionGenerator = require('./util/generator/question-generator');
const SurveyGenerator = require('./util/generator/survey-generator');
const Generator = require('./util/generator');
const SurveyHistory = require('./util/survey-history');
const SharedSpec = require('./util/shared-spec');
const surveyCommon = require('./util/survey-common');

const expect = chai.expect;

const ConditionalSurveyGenerator = (function () {
    const conditionalQuestions = {
        '0-3': { type: 'choice', logic: 'equals', count: 3 },
        '1-5': { type: 'choice', logic: 'equals', count: 1 },
        '2-3': { type: 'bool', logic: 'equals', count: 2 },
        '3-0': { type: 'text', logic: 'exists', count: 1 },
        '4-2': { type: 'choices', logic: 'equals', count: 2 }
    };

    const requiredOverrides = {
        '0-3': false,
        '1-5': true,
        '1-6': true,
        '2-3': true,
        '2-4': true,
        '2-5': true,
        '3-0': true,
        '3-1': true,
        '4-2': false,
        '4-3': true,
        '4-4': true
    };

    return class ConditionalSurveyGenerator extends SurveyGenerator {
        constructor(conditionalQuestionGenerator, answerer) {
            super(conditionalQuestionGenerator);
            this.answerer = answerer;
        }

        sectionType() {
            return 0;
        }

        count() {
            return 8;
        }

        newSurveyQuestion(index) {
            const surveyIndex = this.currentIndex();
            const key = `${surveyIndex}-${index}`;
            const questionInfo = conditionalQuestions[key];
            let question;
            if (questionInfo) {
                const { type, logic, count } = questionInfo;
                const skip = { rule: { logic }, count };
                question = this.questionGenerator.newQuestion(type);
                if (logic === 'equals') {
                    skip.rule.answer = this.answerer.answerRawQuestion(question);
                }
                question.skip = skip;
            } else {
                question = super.newSurveyQuestion(index);
            }
            const requiredOverride = requiredOverrides[key];
            if (requiredOverride !== undefined) {
                question.required = requiredOverride;
            }
            return question;
        }
    };
})();

const answerer = new Answerer();
const questionGenerator = new QuestionGenerator();
const surveyGenerator = new ConditionalSurveyGenerator(questionGenerator, answerer);
const generator = new Generator({ surveyGenerator, questionGenerator, answerer });
const shared = new SharedSpec(generator);

describe('survey (conditional questions) unit', function () {
    before(shared.setUpFn());

    let surveyCount = 5;

    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);

    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, tests.createSurveyFn());
        it(`get survey ${i}`, tests.getSurveyFn(i));
    }

    _.range(surveyCount).forEach(surveyIndex => {
        it(`create survey ${surveyIndex + 4} from survey ${surveyIndex} questions`, function () {
            const survey = hxSurvey.server(surveyIndex);
            const questions = survey.questions.map(({ id, required, skip }) => {
                const question = { id, required };
                if (skip) {
                    question.skip = _.cloneDeep(skip);
                    delete question.skip.rule.id;
                }
                return question;
            });
            const newSurvey = _.cloneDeep(hxSurvey.client(surveyIndex));
            newSurvey.questions = questions;
            delete newSurvey.sections;
            return models.survey.createSurvey(newSurvey)
                .then(id => {
                    const survey = _.cloneDeep(hxSurvey.server(surveyIndex));
                    survey.id = id;
                    hxSurvey.push(newSurvey, survey);
                });
        });
    });

    const verifySurveyFn = function (index) {
        return function () {
            const survey = _.cloneDeep(hxSurvey.server(index));
            return models.survey.getSurvey(survey.id)
                .then(serverSurvey => {
                    serverSurvey.questions.forEach((question, index) => {
                        const ruleId = _.get(question, 'skip.rule.id');
                        if (ruleId) {
                            const newRuleId = survey.questions[index].skip.rule.id;
                            question.skip.rule.id = newRuleId;
                        }
                    });
                    delete survey.sections;
                    expect(serverSurvey).to.deep.equal(survey);
                });
        };
    };

    _.range(surveyCount, 2 * surveyCount).forEach(surveyIndex => {
        it(`verify survey ${surveyIndex}`, verifySurveyFn(surveyIndex));
    });
});
