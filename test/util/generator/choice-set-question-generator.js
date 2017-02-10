'use strict';

const QuestionGenerator = require('./question-generator');

module.exports = class ChoiceSetQuestionGenerator extends QuestionGenerator {
    constructor(predecessor, choiceSets) {
        super(predecessor);
        this.choiceSets = choiceSets;
        this.choiceSetIndex = 0;
    }

    newQuestion() {
        const index = ++this.choiceSetIndex;
        const choiceSetInfo = this.choiceSets[index % this.choiceSets.length];
        const layoutIndex = index % 2;
        if (layoutIndex === 0) {
            const result = this.newBody('choice-ref');
            result.choiceSetId = choiceSetInfo.id;
            return result;
        }
        if (layoutIndex === 1) {
            const result = this.newBody('choice-ref');
            result.choiceSetReference = choiceSetInfo.reference;
            return result;
        }
        return null;
    }
};
