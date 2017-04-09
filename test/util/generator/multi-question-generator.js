'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const QuestionGenerator = require('./question-generator');

module.exports = class MultiQuestionGenerator extends QuestionGenerator {
    newQuestion(options = {}) {
        return this.newMultiQuestion(options);
    }
};
