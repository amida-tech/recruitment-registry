'use strict';

const _ = require('lodash');

module.exports = class AnswerRuleDAO {
    constructor() {}

    evaluateAnswerRule({ count, rule: { logic, answer, selectionIds } }, questionAnswer) {
        if (logic === 'exists') {
            if (questionAnswer && (questionAnswer.answer || questionAnswer.answers)) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'not-exists') {
            if (!(questionAnswer && (questionAnswer.answer || questionAnswer.answers))) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'equals') {
            if (!questionAnswer) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }

            if (_.isEqual(answer, questionAnswer.answer)) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'not-equals') {
            if (!questionAnswer) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
            if (!_.isEqual(answer, questionAnswer.answer)) {
                return { multiple: false, indices: _.range(1, count + 1) };
            }
        }
        if (logic === 'not-selected') {
            const multiple = selectionIds.length > 1 && count === 1;
            if (!(questionAnswer && questionAnswer.answer)) {
                if (multiple) {
                    return { multiple, indices: _.range(0, selectionIds.length) };
                } else {
                    return { multiple, indices: _.range(1, count + 1) };
                }
            }
            const offset = multiple ? 0 : 1;
            const ids = new Set(questionAnswer.answer.choices.map(choice => choice.id));
            const indices = selectionIds.reduce((r, id, index) => {
                if (!ids.has(id)) {
                    r.push(index + offset);
                }
                return r;
            }, []);
            return { multiple, maxCount: selectionIds.length, indices };
        }
        return { multiple: false, indices: [] };
    }
};
