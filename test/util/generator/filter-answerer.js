'use strict';

const Answerer = require('./answerer');

module.exports = class FilterAnswerer extends Answerer {
    integer() {
        const answerIndex = this.answerIndex;
        switch (answerIndex % 8) {
        case 1:
            return { integerRange: { max: answerIndex } };
        case 2:
            return { integerRange: { min: answerIndex } };
        case 3: {
            const max = answerIndex + 10;
            const min = answerIndex - 10;
            return { integerRange: { min, max } };
        }
        case 4:
            return { integerRange: { max: 0 } };
        case 5:
            return { integerRange: { min: 0 } };
        case 6: {
            const max = answerIndex + 10;
            const min = 0;
            return { integerRange: { min, max } };
        }
        case 7: {
            const max = 0;
            const min = -answerIndex - 10;
            return { integerRange: { min, max } };
        }
        default:
            return { integerValue: answerIndex };
        }
    }
};
