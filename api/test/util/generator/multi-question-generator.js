'use strict';

const QuestionGenerator = require('./question-generator');

module.exports = class MultiQuestionGenerator extends QuestionGenerator {
    constructor(predecessor) {
        super(predecessor);
    }

    newQuestion(type) {
        if (!type) {
            const types = QuestionGenerator.singleQuestionTypes();
            type = types[(this.index + 1) % types.length];
        }
        const result = this.newBody(type);
        result.multiple = true;
        const max = this.index % 5;
        if (max < 3) {
            result.maxCount = 8 - max;
        }
        return result;
    }
};
