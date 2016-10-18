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
    },
    translateConsentType(consentType, language) {
        const result = _.pick(consentType, ['id', 'title']);
        result.title = this._translate(result.title, language);
        return result;
    },
    translateConsentDocument(consentDocument, language) {
        const result = _.pick(consentDocument, ['id', 'content', 'updateComment']);
        result.content = this._translate(result.content, language);
        if (result.updateComment) {
            result.updateComment = this._translate(result.updateComment, language);
        } else {
            result.updateComment = null;
        }
        return result;
    }
};

module.exports = translator;
