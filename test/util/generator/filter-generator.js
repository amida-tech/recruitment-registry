'use strict';

const _ = require('lodash');

const Answerer = require('./filter-answerer');

module.exports = class FilterGenerator {
    constructor() {
        this.index = -1;
        this.questionIndex = -1;
        this.answerer = new Answerer();
    }

    newBody() {
        this.index += 1;
        const index = this.index;
        const filter = { name: `name_${index}` };
        return filter;
    }

    newFilter(hxQuestion) {
        const filter = this.newBody();
        const numQuestions = (this.index % 4) + 1;

        filter.questions = _.range(numQuestions).map(() => {
            this.questionIndex += 1;
            const questionPoolSize = hxQuestion.length();
            const questionIndex = this.questionIndex % questionPoolSize;
            const question = hxQuestion.server(questionIndex);
            const answerCount = (questionIndex % 3) + 1;
            const questionId = question.id;
            const answers = _.range(answerCount).map(() => this.answerer.answerFilterQuestion(question)); // eslint-disable-line max-len
            const result = { id: questionId, answers };
            const excludeIndex = questionIndex % 3;
            if (!excludeIndex) {
                return result;
            }
            result.exclude = (excludeIndex === 1);
            return result;
        });
        return filter;
    }

    newFilterQuestionsReady(questions) {
        const filter = this.newBody();
        filter.questions = questions;
        return filter;
    }
};
