'use strict';

module.exports = class QuestionIdentifierGenerator {
    constructor() {
        this.index = 0;
    }

    newIdentifiers(question, type) {
        this.index += 1;
        const identifier = `qid-${this.index}-${question.id}`;
        const result = { type, identifier };
        const questionType = question.type;
        if ((questionType === 'choice') || (questionType === 'choices')) {
            result.answerIdentifiers = question.choices.map(choice => ({
                identifier: `cid-${this.index}-${question.id}-${choice.id}`,
                questionChoiceId: choice.id,
            }));
        } else {
            this.index += 1;
            const answerIdentifier = `aid-${this.index}-${question.id}`;
            result.answerIdentifier = answerIdentifier;
        }
        return result;
    }

    reset() {
        this.index = 0;
    }
};
