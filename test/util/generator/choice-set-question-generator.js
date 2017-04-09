'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const QuestionGenerator = require('./question-generator');

module.exports = class ChoiceSetQuestionGenerator extends QuestionGenerator {
    constructor(predecessor, choiceSets) {
        super(predecessor);
        this.choiceSets = choiceSets;
        this.choiceSetIndex = -1;
    }

    newQuestion() {
        this.choiceSetIndex += 1;
        const index = this.choiceSetIndex;
        const choiceSetInfo = this.choiceSets[index % this.choiceSets.length];
        const layoutIndex = index % 2;
        if (layoutIndex === 0) {
            const result = this.newBody({ type: 'choice-ref' });
            result.choiceSetId = choiceSetInfo.id;
            return result;
        }
        if (layoutIndex === 1) {
            const result = this.newBody({ type: 'choice-ref' });
            result.choiceSetReference = choiceSetInfo.reference;
            return result;
        }
        return null;
    }
};
