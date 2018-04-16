'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

const singleQuestionTypes = [
    'text', 'choice', 'open-choice', 'bool',
    'integer', 'zip', 'pounds', 'float',
    'date', 'year', 'month', 'day',
    'feet-inches', 'blood-pressure',
    'scale',
];

const virtualQuestionTypes = [
    'choicesMeta', 'choiceMeta',
];

const questionTypes = ['choices', ...singleQuestionTypes, ...virtualQuestionTypes];

const updateIdentifiers = function (question, identifiers) {
    const { type, postfix } = identifiers;
    question.questionIdentifier = { type, value: `qx_${postfix}` };
    const qxType = question.type;
    if (qxType === 'choice' || qxType === 'choices') {
        question.choices.forEach((choice, index) => {
            choice.answerIdentifier = { type, value: `choice_${postfix}_${index}` };
        });
    } else {
        question.answerIdentifier = { type, value: `answer_${postfix}` };
    }
};

module.exports = class QuestionGenerator {
    constructor(predecessor, options = {}) {
        if (predecessor) {
            const { index, choiceIndex, typeChoiceIndex, typeChoicesIndex, noMeta } = predecessor;
            Object.assign(this, { index, choiceIndex, typeChoiceIndex, typeChoicesIndex, noMeta });
        } else {
            this.index = -1;
            this.choiceIndex = 0;
            this.typeChoiceIndex = -1;
            this.typeChoicesIndex = -1;
            this.choicesCode = false;
            this.noMeta = options.noMeta;
        }
    }

    static singleQuestionTypes() {
        return singleQuestionTypes;
    }

    static questionTypes() {
        return questionTypes;
    }

    body(type) {
        this.index += 1;
        const index = this.index;
        const result = { text: `text_${index}`, type, isIdentifying: false };
        if (index % 2 === 0) {
            result.instruction = `instruction_${index}`;
        }
        if (index % 5 === 0) {
            result.common = true;
        }
        if (index % 5 === 1) {
            result.common = false;
        }
        const metaIndex = index % 3;
        if (metaIndex > 0 && !this.noMeta) {
            result.meta = {
                someBool: metaIndex === 1,
                someOtherBool: metaIndex === 2,
            };
        }
        return result;
    }

    newChoices(count) {
        const choiceCount = count || 5;
        const startIndex = this.choiceIndex;
        const endIndex = this.choiceIndex + choiceCount;
        this.choiceIndex = endIndex;
        return _.range(startIndex, endIndex).map(i => `choice_${i}`);
    }

    choice(options = {}) {
        const { noOneOf, choiceCount } = options;
        this.typeChoiceIndex += 1;
        const typeChoiceIndex = this.typeChoiceIndex;
        const question = this.body('choice');
        if (choiceCount === 0) {
            return Object.assign(question, { choices: [] });
        }
        const choices = this.newChoices(choiceCount);
        if (((typeChoiceIndex % 3) === 0) && !noOneOf) {
            question.oneOfChoices = choices;
        } else if ((typeChoiceIndex % 3) === 1) {
            question.choices = choices.map(choice => ({ text: choice, code: `code_${choice}` }));
        } else {
            question.choices = choices.map(choice => ({ text: choice }));
        }
        return question;
    }

    openChoice() {
        const question = this.choice({ noOneOf: true });
        question.choices.push({ text: 'free text', type: 'text' });
        question.type = 'open-choice';
        return question;
    }

    choiceMeta() {
        const question = this.body('choice');
        const choices = this.newChoices();
        question.choices = choices.map((choice, index) => {
            const r = { text: choice };
            if (!this.noMeta) {
                r.meta = { tag: (index * 10) + 10 };
            }
            return r;
        });
        return question;
    }

    choices(options = {}) {
        const question = this.body('choices');
        let choices;
        const choiceCount = options.choiceCount;
        if (choiceCount === 0) {
            return Object.assign(question, { choices: [] });
        }
        const newChoices = this.newChoices(choiceCount);
        if (this.choicesCode) {
            this.choicesCode = false;
            choices = newChoices.map(choice => ({ text: choice, code: `code_${choice}` }));
        } else {
            this.choicesCode = true;
            choices = newChoices.map(choice => ({ text: choice }));
        }
        if (!options.noText) {
            choices.forEach((choice) => {
                this.typeChoicesIndex += 1;
                const choiceType = this.typeChoicesIndex % 4;
                switch (choiceType) {
                case 3:
                    choice.type = 'text';
                    break;
                default:
                    choice.type = 'bool';
                }
            });
        }
        question.choices = choices;
        return question;
    }

    choicesMeta() {
        const question = this.body('choices');
        const choices = this.newChoices().map((choice, index) => {
            const r = { text: choice, type: 'bool' };
            if (!this.noMeta) {
                r.meta = { tag: (index * 10) + 10 };
            }
            return r;
        });
        question.choices = choices;
        return question;
    }

    scale(options) {
        const question = this.body('scale');
        if (options.scaleLimits) {
            question.scaleLimits = options.scaleLimits;
            return question;
        }
        const scaleLimits = {};
        const value = this.index % 5;
        if (value <= 3) {
            scaleLimits.min = 10.5 + value;
        }
        if (value >= 2) {
            scaleLimits.max = 90.5 + value;
        }
        question.scaleLimits = scaleLimits;
        return question;
    }

    newBody(options) {
        const type = options.type;
        const key = _.camelCase(type);
        return this[key] ? this[key](options) : this.body(type);
    }

    newQuestion(inputOptions = {}) {
        if (inputOptions.multi) {
            return this.newMultiQuestion(inputOptions);
        }
        const options = Object.assign({}, inputOptions);
        if (!options.type) {
            options.type = questionTypes[(this.index + 1) % questionTypes.length];
        }
        const result = this.newBody(options);
        if (options.identifiers) {
            updateIdentifiers(result, options.identifiers);
        }
        return result;
    }

    newMultiQuestion(inputOptions = {}) {
        const options = Object.assign({}, inputOptions);
        if (!options.type) {
            const types = QuestionGenerator.singleQuestionTypes();
            options.type = types[(this.index + 1) % types.length];
        }
        const result = this.newBody(options);
        result.multiple = true;
        const max = options.max || this.index % 5;
        if (max < 3) {
            result.maxCount = 8 - max;
        }
        if (options.identifiers) {
            updateIdentifiers(result, options.identifiers);
        }
        return result;
    }
};
