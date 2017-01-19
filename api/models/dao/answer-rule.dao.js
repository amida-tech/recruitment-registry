'use strict';

const _ = require('lodash');

module.exports = class AnswerRuleDAO {
    constructor() {}

    evaluateAnswerRule({ count, rule: { logic, answer } }, questionAnswer) {
        if (logic === 'exists') {
            if (questionAnswer && (questionAnswer.answer || questionAnswer.answers)) {
                return _.range(1, count + 1);
            }
        }
        if (logic === 'not-exists') {
            if (!(questionAnswer && (questionAnswer.answer || questionAnswer.answers))) {
                return _.range(1, count + 1);
            }
        }
        if (logic === 'equals') {
            if (!questionAnswer) {
                return _.range(1, count + 1);
            }

            if (_.isEqual(answer, questionAnswer.answer)) {
                return _.range(1, count + 1);
            }
        }
        if (logic === 'not-equals') {
            if (!questionAnswer) {
                return _.range(1, count + 1);
            }
            if (!_.isEqual(answer, questionAnswer.answer)) {
                return _.range(1, count + 1);
            }
        }
        return [];
    }
};
