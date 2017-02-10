'use strict';

const QuestionGenerator = require('./question-generator');

module.exports = class EnumerationQuestionGenerator extends QuestionGenerator {
    constructor(predecessor, enumerations) {
        super(predecessor);
        this.enumerations = enumerations;
        this.enumerationIndex = 0;
    }

    newQuestion() {
        const index = ++this.enumerationIndex;
        const enumerationInfo = this.enumerations[index % this.enumerations.length];
        const layoutIndex = index % 2;
        if (layoutIndex === 0) {
            const result = this.newBody('choice-ref');
            result.choiceSetId = enumerationInfo.id;
            return result;
        }
        if (layoutIndex === 1) {
            const result = this.newBody('choice-ref');
            result.choiceSetReference = enumerationInfo.reference;
            return result;
        }
        return null;
    }
};
