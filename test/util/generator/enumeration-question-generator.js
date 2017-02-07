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
        const layoutIndex = index % 8;
        if (layoutIndex === 0) {
            const result = this.newBody('enumeration');
            result.enumerationId = enumerationInfo.id;
            return result;
        }
        if (layoutIndex === 1) {
            const result = this.enumerationChoices();
            result.enumerationId = enumerationInfo.id;
            return result;
        }
        if (layoutIndex === 2) {
            const result = this.enumerationChoices();
            result.enumerationId = enumerationInfo.id;
            const enumerationInfo2 = this.enumerations[(index + 1) % this.enumerations.length];
            result.choices.forEach((choice, index2) => {
                if (index2 % 2) {
                    choice.enumerationId = enumerationInfo2.id;
                }
            });
            return result;
        }
        if (layoutIndex === 3) {
            const result = this.enumerationChoices();
            const enumerationInfo2 = this.enumerations[(index + 1) % this.enumerations.length];
            result.choices.forEach((choice, index2) => {
                choice.enumerationId = (index2 % 2 ? enumerationInfo.id : enumerationInfo2.id);
            });
            return result;
        }
        if (layoutIndex === 4) {
            const result = this.newBody('enumeration');
            result.enumeration = enumerationInfo.reference;
            return result;
        }
        if (layoutIndex === 5) {
            const result = this.enumerationChoices();
            result.enumeration = enumerationInfo.reference;
            return result;
        }
        if (layoutIndex === 6) {
            const result = this.enumerationChoices();
            result.enumeration = enumerationInfo.reference;
            const enumerationInfo2 = this.enumerations[(index + 1) % this.enumerations.length];
            result.choices.forEach((choice, index2) => {
                if (index2 % 2) {
                    choice.enumeration = enumerationInfo2.reference;
                }
            });
            return result;
        }
        if (layoutIndex === 7) {
            const result = this.enumerationChoices();
            const enumerationInfo2 = this.enumerations[(index + 1) % this.enumerations.length];
            result.choices.forEach((choice, index2) => {
                choice.enumeration = (index2 % 2 ? enumerationInfo.reference : enumerationInfo2.reference);
            });
            return result;
        }
        return null;
    }
};
