'use strict';

const QuestionGenerator = require('./question-generator');

module.exports = class MultiQuestionGenerator extends QuestionGenerator {
    newQuestion(type) {
        return this.newMultiQuestion(type);
    }
};
