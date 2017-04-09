'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = class QuestionGenerator {
    constructor() {
        this.index = -1;
    }

    newQuestionChoice(options = {}) {
        this.index += 1;
        const index = this.index;
        const newChoice = { text: `choice_${index}` };
        if (options.alwaysCode || (index % 2 === 0)) {
            newChoice.code = `code_${index}`;
        }
        if (index % 3 === 3) {
            newChoice.meta = { field: `meta_field_${index}` };
        }
        return newChoice;
    }
};
