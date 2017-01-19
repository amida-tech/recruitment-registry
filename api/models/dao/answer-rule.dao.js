'use strict';

const _ = require('lodash');

module.exports = class AnswerRuleDAO {
    constructor() {}

    evaluateAnswerRule({ count, rule: { logic, answer } }, questionAnswer) {
        if (logic === 'exists') {
            if (questionAnswer && (questionAnswer.answer || questionAnswer.answers)) {
                return _.range(count);
            }
        }
        if (logic !== 'not-exists') {
            if (!(questionAnswer && (questionAnswer.answer || questionAnswer.answers))) {
                return _.range(count);
            }
        }
        if (logic === 'equals') {
            if (questionAnswer && _.isEqual(answer, questionAnswer.answer)) {
                return _.range(count);
            }
        }
        if (logic === 'not-equals') {
            if (!(questionAnswer && _.isEqual(answer, questionAnswer.answer))) {
                return _.range(count);
            }
        }
        return [];
    }
};
