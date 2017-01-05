'use strict';

const _ = require('lodash');

const singleQuestionTypes = [
    'text', 'choice', 'bool',
    'integer', 'zip', 'pounds',
    'date', 'year', 'month', 'day',
    'feet-inches', 'blood-pressure'
];

const virtualQuestionTypes = [
    'dateChoices', 'integerChoices', 'choicesMeta', 'choiceMeta'
];

const questionTypes = ['choices', ...singleQuestionTypes, ...virtualQuestionTypes];

module.exports = class QuestionGenerator {
    constructor(predecessor) {
        if (predecessor) {
            const { index, choiceIndex, typeChoiceIndex, typeChoicesIndex } = predecessor;
            Object.assign(this, { index, choiceIndex, typeChoiceIndex, typeChoicesIndex });
        } else {
            this.index = -1;
            this.choiceIndex = 0;
            this.typeChoiceIndex = -1;
            this.typeChoicesIndex = -1;
        }
    }

    static singleQuestionTypes() {
        return singleQuestionTypes;
    }

    static questionTypes() {
        return questionTypes;
    }

    body(type) {
        const index = ++this.index;
        const result = { text: `text_${index}`, type };
        if (index % 2 === 0) {
            result.instruction = `instruction_${index}`;
        }
        const metaIndex = index % 3;
        if (metaIndex > 0) {
            result.meta = {
                someBool: metaIndex === 1,
                someOtherBool: metaIndex === 2
            };
        }
        return result;
    }

    newChoices() {
        const startIndex = this.choiceIndex;
        const endIndex = this.choiceIndex + 5;
        this.choiceIndex = endIndex;
        return _.range(startIndex, endIndex).map(i => `choice_${i}`);
    }

    choice() {
        const typeChoiceIndex = ++this.typeChoiceIndex;
        const question = this.body('choice');
        const choices = this.newChoices();
        if (typeChoiceIndex % 2) {
            question.oneOfChoices = choices;
        } else {
            question.choices = choices.map(choice => ({ text: choice }));
        }
        return question;
    }

    choiceMeta() {
        const question = this.body('choice');
        const choices = this.newChoices();
        question.choices = choices.map((choice, index) => ({ text: choice, meta: { tag: index * 10 + 10 } }));
        return question;
    }

    choices() {
        const question = this.body('choices');
        const choices = this.newChoices().map(choice => ({ text: choice }));
        choices.forEach(choice => {
            const choiceType = ++this.typeChoicesIndex % 4;
            switch (choiceType) {
            case 2:
                choice.type = 'bool';
                break;
            case 3:
                choice.type = 'text';
                break;
            }
        });
        question.choices = choices;
        return question;
    }

    choicesMeta() {
        const question = this.body('choices');
        const choices = this.newChoices().map((choice, index) => ({ text: choice, type: 'bool', meta: { tag: index * 10 + 10 } }));
        question.choices = choices;
        return question;
    }

    dateChoices() {
        const question = this.body('choices');
        question.choices = [{
            text: 'year text',
            type: 'year'
        }, {
            text: 'month text',
            type: 'month'
        }, {
            text: 'day text',
            type: 'day'
        }];
        return question;
    }

    integerChoices() {
        const question = this.body('choices');
        question.choices = [{
            text: 'feet',
            type: 'integer'
        }, {
            text: 'inches',
            type: 'integer'
        }];
        return question;
    }

    allChoices() {
        const question = this.body('choices');
        question.choices = [{
            text: 'feet',
            type: 'integer'
        }, {
            text: 'inches',
            type: 'integer'
        }, {
            text: 'year text',
            type: 'year'
        }, {
            text: 'month text',
            type: 'month'
        }, {
            text: 'day text',
            type: 'day'
        }, {
            text: 'text text',
            type: 'text'
        }, {
            text: 'bool text',
            type: 'bool'
        }, {
            text: 'zip text',
            type: 'zip'
        }, {
            text: 'date text',
            type: 'date'
        }, {
            text: 'pounds text',
            type: 'pounds'
        }, {
            text: 'zip text',
            type: 'zip'
        }, {
            text: 'feet-inches text',
            type: 'feet-inches'
        }, {
            text: 'blood-pressure text',
            type: 'blood-pressure'
        }];
        return question;
    }

    boolSoleChoices() {
        const question = this.body('choices');
        const choices = this.newChoices().map(choice => ({ text: choice, type: 'bool' }));
        choices[choices.length - 1].type = 'bool-sole';
        question.choices = choices;
        return question;
    }

    newActions(index, count) {
        return _.range(count).map(i => {
            const text = `text_${index}_${i}`;
            const type = `type_${index}_${i}`;
            return { text, type };
        });
    }

    newBody(type) {
        return this[type] ? this[type]() : this.body(type);
    }

    newQuestion(type) {
        type = type || questionTypes[(this.index + 1) % questionTypes.length];
        const result = this.newBody(type);
        const actionCount = (this.index % 3) - 1;
        if (actionCount > 0) {
            result.actions = this.newActions(this.index, actionCount);
        }
        return result;
    }
};
