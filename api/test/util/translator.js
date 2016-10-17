'use strict';

const _ = require('lodash');

const translator = {
    _translate(text, language) {
        return `${text} (${language})`;
    },
    translateQuestion(question, language) {
        const result = _.cloneDeep(question);
        result.text = this._translate(result.text, language);
        delete result.type;
        if (result.choices) {
            result.choices.forEach(choice => {
                choice.text = this._translate(choice.text, language);
                delete choice.type;
            });
        }
        if (result.actions) {
            result.actions.forEach(action => {
                action.text = this._translate(action.text, language);
                delete action.type;
            });
        }
        return result;
    }
};

module.exports = translator;
