'use strict';

const _ = require('lodash');

module.exports = class Answerer {
    constructor(predecessor) {
        if (predecessor) {
            const { answerIndex, answerChoicesCountIndex, multiCount } = predecessor;
            Object.assign(this, { answerIndex, answerChoicesCountIndex, multiCount });
        } else {
            this.answerIndex = -1;
            this.answerChoicesCountIndex = 0;
            this.multiCount = 0;
        }
    }

    text() {
        const answerIndex = this.answerIndex;
        return { textValue: `text_${answerIndex}` };
    }

    zip() {
        const answerIndex = this.answerIndex;
        const zip = ['20850', '53727', '76333', '74747'][answerIndex % 4];
        return { textValue: zip };
    }

    bloodPressure() {
        const answerIndex = this.answerIndex;
        return {
            bloodPressureValue: {
                systolic: 100 + (answerIndex % 40),
                diastolic: 70 + (answerIndex % 20)
            }
        };
    }

    feetInches() {
        const answerIndex = this.answerIndex;
        return {
            feetInchesValue: {
                feet: 5 + (answerIndex % 2),
                inches: answerIndex % 12
            }
        };
    }

    date() {
        const answerIndex = this.answerIndex;
        const month = answerIndex % 8 + 1;
        const day = answerIndex % 13 + 10;
        const year = answerIndex % 34 + 1970;
        return { dateValue: `${year}-0${month}-${day}` };
    }

    year() {
        const answerIndex = this.answerIndex;
        const year = answerIndex % 34 + 1980;
        return { yearValue: `${year}` };
    }

    month() {
        const answerIndex = this.answerIndex;
        const month = answerIndex % 8 + 1;
        return { monthValue: `0${month}` };
    }

    day() {
        const answerIndex = this.answerIndex;
        const day = answerIndex % 13 + 10;
        return { dayValue: `${day}` };
    }

    integer() {
        const answerIndex = this.answerIndex;
        return { integerValue: answerIndex };
    }

    pounds() {
        const answerIndex = this.answerIndex;
        const numberValue = 100 + answerIndex;
        return { numberValue };
    }

    bool() {
        const answerIndex = this.answerIndex;
        return { boolValue: answerIndex % 2 === 0 };
    }

    enumeration(question, choice) {
        const enumerals = (choice && choice.enumerals) || question.enumerals;
        const enumeral = enumerals[this.answerIndex % enumerals.length];
        return { integerValue: enumeral.value };
    }

    selectChoice(choices) {
        const answerIndex = this.answerIndex;
        return choices[answerIndex % choices.length];
    }

    choice(question) {
        const choice = this.selectChoice(question.choices);
        return { choice: choice.id };
    }

    choices(question) {
        ++this.answerIndex;
        this.answerChoicesCountIndex = (this.answerChoicesCountIndex + 1) % 3;
        const choiceCount = Math.min(this.answerChoicesCountIndex + 1, question.choices.length);
        const choices = _.range(choiceCount).map(() => {
            ++this.answerIndex;
            const choice = this.selectChoice(question.choices);
            const answer = { id: choice.id };
            if (choice.type !== 'bool') {
                Object.assign(answer, this[choice.type](question, choice));
            }
            return answer;
        });

        return { choices: _.sortBy(choices, 'id') };
    }

    answerQuestion(question) {
        const type = _.camelCase(question.type);
        if (question.multiple) {
            ++this.multiCount;
            const answers = _.range(this.multiCount % 4 + 1).map((multipleIndex) => {
                ++this.answerIndex;
                return Object.assign({ multipleIndex }, this[type](question));
            });
            return { questionId: question.id, answers };
        } else {
            ++this.answerIndex;
            const answer = this[type](question);
            return { questionId: question.id, answer };
        }
    }

    answerMultipleQuestion(question, multipleIndices) {
        const type = _.camelCase(question.type);
        const answers = multipleIndices.map((multipleIndex) => {
            ++this.answerIndex;
            return Object.assign({ multipleIndex }, this[type](question));
        });
        return { questionId: question.id, answers };
    }

    answerChoicesQuestion(question, selectionChoice) {
        const count = question.choices.length;
        const choices = selectionChoice.map(choiceIndex => {
            if (choiceIndex < 0) {
                choiceIndex += count;
            }
            const choice = question.choices[choiceIndex];
            const answer = { id: choice.id };
            if (choice.type !== 'bool') {
                Object.assign(answer, this[choice.type](question, choice));
            }
            return answer;
        });
        return { questionId: question.id, answer: { choices } };
    }

    answerRawQuestion(question) {
        const type = _.camelCase(question.type);
        ++this.answerIndex;
        if (type === 'choice') {
            const choices = question.oneOfChoices || question.choices.map(choice => choice.text);
            return { choiceText: this.selectChoice(choices) };
        }
        if (type === 'choices') {
            const answers = _.range(2).map(() => {
                const choice = this.selectChoice(question.choices);
                this.answerIndex += 2;
                const answer = { text: choice.text };
                if (choice.type && choice.type !== 'bool') {
                    Object.assign(answer, this[choice.type]());
                }
                return answer;
            });
            _.sortBy(answers, 'id');
            return { choices: answers };
        }
        return this[type](question);
    }
};
