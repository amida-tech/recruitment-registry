'use strict';

const _ = require('lodash');

module.exports = class Answerer {
    constructor() {
        this.answerIndex = -1;
        this.answerChoicesCountIndex = 0;
    }

    text(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                textValue: `text_${answerIndex}`
            }
        };
    }

    zip(question) {
        const answerIndex = ++this.answerIndex;
        const zip = ['20850', '53727', '76333', '74747'][answerIndex % 4];
        return {
            questionId: question.id,
            answer: {
                textValue: zip
            }
        };
    }

    bloodPressure(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                bloodPressureValue: {
                    systolic: 100 + (answerIndex % 40),
                    diastolic: 70 + (answerIndex % 20)
                }
            }
        };
    }

    feetInches(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                feetInchesValue: {
                    feet: 5 + (answerIndex % 2),
                    inches: answerIndex % 12
                }
            }
        };
    }

    date(question) {
        const answerIndex = ++this.answerIndex;
        const month = answerIndex % 8 + 1;
        const day = answerIndex % 13 + 10;
        const year = answerIndex % 34 + 1970;
        return {
            questionId: question.id,
            answer: {
                dateValue: `${year}-0${month}-${day}`
            }
        };
    }

    year(question) {
        const answerIndex = ++this.answerIndex;
        const year = answerIndex % 34 + 1980;
        return {
            questionId: question.id,
            answer: {
                yearValue: `${year}`
            }
        };
    }

    month(question) {
        const answerIndex = ++this.answerIndex;
        const month = answerIndex % 8 + 1;
        return {
            questionId: question.id,
            answer: {
                monthValue: `0${month}`
            }
        };
    }

    day(question) {
        const answerIndex = ++this.answerIndex;
        const day = answerIndex % 13 + 10;
        return {
            questionId: question.id,
            answer: {
                dayValue: `${day}`
            }
        };
    }

    integer(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                integerValue: answerIndex
            }
        };
    }

    pounds(question) {
        const answerIndex = ++this.answerIndex;
        const numberValue = 100 + answerIndex;
        return {
            questionId: question.id,
            answer: {
                numberValue
            }
        };
    }

    bool(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                boolValue: answerIndex % 2 === 0
            }
        };
    }

    choice(question) {
        const answerIndex = ++this.answerIndex;
        const choice = question.choices[answerIndex % question.choices.length];
        return {
            questionId: question.id,
            answer: {
                choice: choice.id
            }
        };
    }

    choices(question) {
        ++this.answerIndex;
        this.answerChoicesCountIndex = (this.answerChoicesCountIndex + 1) % 3;
        const choiceCount = Math.min(this.answerChoicesCountIndex + 1, question.choices.length);
        const choices = _.range(choiceCount).map(() => {
            const answerIndex = ++this.answerIndex;
            const choice = question.choices[answerIndex % question.choices.length];
            const answer = {
                id: choice.id
            };
            if (choice.type === 'text') {
                answer.textValue = `text_${answerIndex}`;
            }
            if (choice.type === 'integer') {
                answer.integerValue = answerIndex;
            }
            if (choice.type === 'year') {
                answer.yearValue = `${answerIndex % 34 + 1980}`;
            }
            if (choice.type === 'month') {
                answer.monthValue = `0${answerIndex % 8 + 1}`;
            }
            if (choice.type === 'day') {
                answer.dayValue = `${answerIndex % 13 + 10}`;
            }
            return answer;
        });

        return {
            questionId: question.id,
            answer: {
                choices: _.sortBy(choices, 'id')
            }
        };
    }
};
