'use strict';

const QuestionGenerator = require('./question-generator');

module.exports = class MultiQuestionGenerator extends QuestionGenerator {
    constructor(predecessor) {
        super(predecessor);
    }

    newQuestion(type) {
    	return this.newMultiQuestion(type);
    }
};
