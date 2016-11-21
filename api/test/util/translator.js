'use strict';

const _ = require('lodash');
const chai = require('chai');

const expect = chai.expect;

const translator = {
    _translate(text, language) {
        return `${text} (${language})`;
    },
    _isTranslated(texts, language) {
        const languageText = `(${language})`;
        texts.forEach(text => {
            if (text !== null) {
                const location = text.indexOf(languageText);
                expect(location).to.be.above(0, `is not translated to ${language}`);
            }
        });
    },
    translateQuestion(question, language) {
        const result = _.cloneDeep(question);
        result.text = this._translate(result.text, language);
        delete result.type;
        delete result.meta;
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
    translateSurvey(survey, language) {
        const result = _.cloneDeep(survey);
        result.name = this._translate(result.name, language);
        if (result.description) {
            result.description = this._translate(result.description, language);
        }
        delete result.meta;
        if (result.sections) {
            result.sections.forEach(section => {
                section.name = this._translate(section.name, language);
                delete section.indices;
            });
        }
        delete result.questions;
        return result;
    },
    isSurveyTranslated(survey, language) {
        const texts = [survey.name];
        if (survey.description) {
            texts.push(survey.description);
        }
        if (survey.sections) {
            texts.push(...survey.sections.map(section => section.name));
        }
        this._isTranslated(texts, language);
    },
    isSurveyListTranslated(surveys, language) {
        const texts = surveys.map(survey => survey.name);
        const descriptions = surveys.filter(survey => survey.description).map(survey => survey.description);
        this._isTranslated([...texts, ...descriptions], language);
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
        }
        return result;
    },
    isConsentDocumentTranslated(consentDocument, language) {
        const languageText = `(${language})`;
        consentDocument.sections.forEach(section => {
            ['title', 'content', 'updateComment'].forEach(property => {
                const text = section[property];
                if (text) {
                    const location = text.indexOf(languageText);
                    expect(location).to.be.above(0, `is not translated to ${language}`);
                }
            });
        });
    }
};

module.exports = translator;
