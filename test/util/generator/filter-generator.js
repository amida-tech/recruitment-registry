'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

const Answerer = require('./answerer');

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
        if ((index % 5) !== 2) {
            filter.maxCount = (index + 1) * 50;
        }
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
            const answers = _.range(answerCount).map(() => this.answerer.answerFilterQuestion(question));
            return { id: questionId, answers };
        });
        return filter;
    }

    newFilterQuestionsReady(questions) {
        const filter = this.newBody();
        filter.questions = questions;
        return filter;
    }
};
