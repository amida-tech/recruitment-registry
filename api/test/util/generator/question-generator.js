'use strict';

const _ = require('lodash');

module.exports = class QuestionGenerator {
    constructor() {
        this.types = [
            'text', 'choice', 'choices', 'bool', 'integer',
            'zip', 'date', 'year', 'month', 'day', 'pounds',
            'feet-inches', 'blood-pressure',
            'dateChoices', 'integerChoices'
        ];
        this.index = -1;

        this.choiceIndex = 0;

        this.typeChoiceIndex = -1;

        this.typeChoicesIndex = -1;
    }

    _body(type) {
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

    _choices() {
        const startIndex = this.choiceIndex;
        const endIndex = this.choiceIndex + 5;
        this.choiceIndex = endIndex;
        return _.range(startIndex, endIndex).map(i => `choice_${i}`);
    }

    choice() {
        const typeChoiceIndex = ++this.typeChoiceIndex;
        const question = this._body('choice');
        const choices = this._choices();
        if (typeChoiceIndex % 2) {
            question.oneOfChoices = choices;
        } else {
            question.choices = choices.map(choice => ({ text: choice }));
        }
        return question;
    }

    choices() {
        const question = this._body('choices');
        const choices = this._choices().map(choice => ({ text: choice }));
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

    dateChoices() {
        const question = this._body('choices');
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
        const question = this._body('choices');
        question.choices = [{
            text: 'feet',
            type: 'integer'
        }, {
            text: 'inches',
            type: 'integer'
        }];
        return question;
    }

    newActions(index, count) {
        return _.range(count).map(i => {
            const text = `text_${index}_${i}`;
            const type = `type_${index}_${i}`;
            return { text, type };
        });
    }

    newQuestion() {
        const type = this.types[(this.index + 1) % this.types.length];
        const result = this[type] ? this[type]() : this._body(type);
        const actionCount = (this.index % 3) - 1;
        if (actionCount > 0) {
            result.actions = this.newActions(this.index, actionCount);
        }
        return result;
    }
};
