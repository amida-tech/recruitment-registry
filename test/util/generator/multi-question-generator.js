'use strict';

const QuestionGenerator = require('./question-generator');

module.exports = class MultiQuestionGenerator extends QuestionGenerator {
    newQuestion(options = {}) {
        return this.newMultiQuestion(options);
    }
};
