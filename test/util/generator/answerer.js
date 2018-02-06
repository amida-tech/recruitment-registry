'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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
                diastolic: 70 + (answerIndex % 20),
            },
        };
    }

    feetInches() {
        const answerIndex = this.answerIndex;
        return {
            feetInchesValue: {
                feet: 5 + (answerIndex % 2),
                inches: answerIndex % 12,
            },
        };
    }

    date() {
        const answerIndex = this.answerIndex;
        const month = (answerIndex % 8) + 1;
        const day = (answerIndex % 13) + 10;
        const year = (answerIndex % 34) + 1970;
        return { dateValue: `${year}-0${month}-${day}` };
    }

    year() {
        const answerIndex = this.answerIndex;
        const year = (answerIndex % 34) + 1980;
        return { yearValue: `${year}` };
    }

    month() {
        const answerIndex = this.answerIndex;
        const month = (answerIndex % 8) + 1;
        return { monthValue: `0${month}` };
    }

    day() {
        const answerIndex = this.answerIndex;
        const day = (answerIndex % 13) + 10;
        return { dayValue: `${day}` };
    }

    integer() {
        const answerIndex = this.answerIndex;
        return { integerValue: answerIndex };
    }

    float() {
        const answerIndex = this.answerIndex;
        return { floatValue: answerIndex + 0.1 };
    }

    pounds() {
        const answerIndex = this.answerIndex;
        const numberValue = 100 + answerIndex;
        return { numberValue };
    }

    bool() {
        const answerIndex = this.answerIndex;
        return { boolValue: (answerIndex % 2) === 0 };
    }

    scale(question) {
        const answerIndex = this.answerIndex;
        const { min, max } = question.scaleLimits;
        if (min !== undefined && max !== undefined) {
            return { numberValue: min + (answerIndex % (max - min)) };
        }
        if (min !== undefined) {
            return { numberValue: min + answerIndex };
        }
        if (max !== undefined) {
            return { numberValue: max - answerIndex };
        }
        return { numberValue: 0 };
    }

    selectChoice(choices) {
        const answerIndex = this.answerIndex;
        return choices[answerIndex % choices.length];
    }

    choice(question) {
        const choice = this.selectChoice(question.choices);
        return { choice: choice.id };
    }

    openChoice(question) {
        if (this.answerIndex % 2) {
            const choice = this.selectChoice(question.choices);
            return { choice: choice.id };
        }
        return { textValue: `text_${this.answerIndex}` };
    }

    choiceRef(question) {
        const choice = this.selectChoice(question.choices);
        return { choice: choice.id };
    }

    choices(question) {
        this.answerIndex += 1;
        this.answerChoicesCountIndex = (this.answerChoicesCountIndex + 1) % 3;
        const choiceCount = Math.min(this.answerChoicesCountIndex + 1, question.choices.length);
        const choices = _.range(choiceCount).map(() => {
            this.answerIndex += 1;
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
            this.multiCount += 1;
            const answers = _.range((this.multiCount % 4) + 1).map((multipleIndex) => {
                this.answerIndex += 1;
                return Object.assign({ multipleIndex }, this[type](question));
            });
            return { questionId: question.id, answers };
        }
        this.answerIndex += 1;
        const answer = this[type](question);
        return { questionId: question.id, answer };
    }

    answerFilterQuestion(question) {
        const type = _.camelCase(question.type);
        this.answerIndex += 1;
        if (type === 'choices') {
            const choice = this.selectChoice(question.choices);
            const answer = { choice: choice.id };
            if (choice.type && choice.type !== 'bool') {
                Object.assign(answer, this[choice.type](question));
            }
            return answer;
        }
        return this[type](question);
    }

    answerMultipleQuestion(question, multipleIndices) {
        const type = _.camelCase(question.type);
        const answers = multipleIndices.map((multipleIndex) => {
            this.answerIndex += 1;
            return Object.assign({ multipleIndex }, this[type](question));
        });
        return { questionId: question.id, answers };
    }

    answerChoicesQuestion(question, selectionChoice) {
        const count = question.choices.length;
        const choices = selectionChoice.map((choiceIndex) => {
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

    answerChoiceQuestion(question, choiceIndex) { // eslint-disable-line class-methods-use-this
        const choice = question.choices[choiceIndex].id;
        const answer = { choice };
        return { questionId: question.id, answer };
    }

    answerRawQuestion(question, options = {}) {
        const type = _.camelCase(question.type);
        this.answerIndex += 1;
        if (type === 'choice') {
            const choices = question.oneOfChoices || question.choices.map(choice => choice.text);
            const choiceIndex = options.choiceIndex;
            if (choiceIndex || choiceIndex === 0) {
                return { choiceText: choices[options.choiceIndex] };
            }
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
