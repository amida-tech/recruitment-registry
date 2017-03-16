'use strict';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../../models');

const SharedSpec = require('../shared-spec');
const Generator = require('../generator');
const History = require('../history');
const SurveyHistory = require('../survey-history');
const answerCommon = require('../answer-common');
const questionCommon = require('../question-common');

const QuestionGenerator = require('../generator/question-generator');
const MultiQuestionGenerator = require('../generator/multi-question-generator');
const SurveyGenerator = require('../generator/survey-generator');

const expect = chai.expect;

const answerGenerators = {
    text(questionId, spec) {
        return { answer: { textValue: spec.value } };
    },
    bool(questionId, spec) {
        return { answer: { boolValue: spec.value } };
    },
    choice(questionId, spec, choiceIdMap) {
        const choiceIds = choiceIdMap.get(questionId);
        const choice = choiceIds[spec.choiceIndex];
        return { answer: { choice } };
    },
    choices(questionId, spec, choiceIdMap) {
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
    multichoice(questionId, spec, choiceIdMap) {
        const choiceIds = choiceIdMap.get(questionId);
        const fn = (index, multipleIndex) => ({ choice: choiceIds[index], multipleIndex });
        const answers = spec.choiceIndices.map(fn);
        return { answers };
    },
};

const SpecTests = class SurveySpecTests {
    constructor(offset = 5, surveyCount = 4) {
    	this.offset = offset;
    	this.surveyCount = surveyCount;

    	const generator = new Generator();
    	this.shared = new SharedSpec(generator);

    	const hxUser = new History();
    	const hxSurvey = new SurveyHistory();
    	const hxQuestion = new History();

    	this.hxUser = hxUser;
    	this.hxSurvey = hxSurvey;
    	this.hxQuestion = hxQuestion;

    	this.answerTests = new answerCommon.SpecTests(generator, hxUser, hxSurvey, hxQuestion);
    	this.questionTests = new questionCommon.SpecTests(generator, hxQuestion);
    	this.hxAnswers = this.answerTests.hxAnswer;

    	const questionGenerator = new QuestionGenerator();
    	const multiQuestionGenerator = new MultiQuestionGenerator();
    	this.surveyGenerator = new SurveyGenerator();

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

    	this.typeIndexMap = typeIndexMap;
    	this.types = types;
    	this.questions = questions;

    	this.choiceIdMap = new Map();
    }

    generateChoiceMapFn() {
    	const typeIndexMap = this.typeIndexMap;
    	const hxQuestion = this.hxQuestion;
    	const choiceIdMap = this.choiceIdMap;
		return function generateChoiceMap() {
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
		};
	}

    createSurveyFn(qxIndices) {
    	const hxSurvey = this.hxSurvey;
    	const hxQuestion = this.hxQuestion;
    	const surveyGenerator = this.surveyGenerator;
        return function createSurvey() {
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
    }

    answerInfoToObject(surveyIndex, answerInfo, idProperty = 'questionId') {
        return answerInfo.map((info) => {
            const questionType = info.questionType;
            const questionIndex = this.typeIndexMap.get(questionType)[surveyIndex];
            const questionId = this.hxQuestion.id(questionIndex);
            const answerGenerator = answerGenerators[questionType];
            const answerObject = answerGenerator(questionId, info, this.choiceIdMap);
            return Object.assign({ [idProperty]: questionId }, answerObject);
        });
    }

    searchAnswersFn({ count, answers }) {
    	const self = this;
        return function searchAnswers() {
            const questions = answers.reduce((r, { surveyIndex, answerInfo }) => {
                const answers = self.answerInfoToObject(surveyIndex, answerInfo, 'id');
                r.push(...answers);
                return r;
            }, []);
            const criteria = { questions };
            return models.answer.searchCountUsers(criteria)
                .then(actual => expect(actual).to.equal(count));
        };
    }

    createAnswersFn(userIndex, surveyIndex, answerInfo) {
    	const self = this;
    	const hxUser = this.hxUser;
    	const hxSurvey = this.hxSurvey;
    	const hxAnswers = this.hxAnswers;
        return function createAnswers() {
            const userId = hxUser.id(userIndex);
            const surveyId = hxSurvey.id(surveyIndex);
            const answers = self.answerInfoToObject(surveyIndex, answerInfo);
            const input = { userId, surveyId, answers };
            return models.answer.createAnswers(input)
                .then(() => hxAnswers.push(userIndex, surveyIndex, answers));
        };
    }
};

module.exports = {
    SpecTests,
};
