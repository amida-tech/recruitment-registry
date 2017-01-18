'use strict';

const _ = require('lodash');

const SurveyGenerator = require('./survey-generator');

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

module.exports = class ConditionalSurveyGenerator extends SurveyGenerator {
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

    static newSurveyFromPrevious(clientSurvey, serverSurvey) {
        const questions = serverSurvey.questions.map(({ id, required, skip }) => {
            const question = { id, required };
            if (skip) {
                question.skip = _.cloneDeep(skip);
                delete question.skip.rule.id;
            }
            return question;
        });
        const newSurvey = _.cloneDeep(clientSurvey);
        newSurvey.questions = questions;
        delete newSurvey.sections;
        return newSurvey;
    }
};
