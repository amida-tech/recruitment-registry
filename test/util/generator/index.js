'use strict';

const _ = require('lodash');

const Answerer = require('./answerer');
const QuestionGenerator = require('./question-generator');
const SurveyGenerator = require('./survey-generator');

const testJsutil = require('../test-jsutil');

class Generator {
    constructor(generators = {}) {
        this.answerer = generators.answerer || new Answerer();
        this.questionGenerator = generators.questionGenerator || new QuestionGenerator();
        this.surveyGenerator = generators.surveyGenerator || new SurveyGenerator(this.questionGenerator);

        this.userIndex = -1;
        this.consentTypeIndex = -1;
        this.consentDocumentIndex = -1;
        this.consentTypeAdded = {};
        this.consentIndex = -1;
        this.languageIndex = -1;
        this.assessmentIndex = -1;
        this.enumerationindex = 0;
    }

    updateSurveyGenerator(SurveyGenerator) {
        this.surveyGenerator = this.surveyGenerator.newSurveyGenerator(SurveyGenerator);
    }

    updateAnswererClass(AnswererClass) {
        this.answerer = new AnswererClass(this.answerer);
    }

    newUser(override) {
        const userIndex = ++this.userIndex;
        let username = 'uSeRnAmE';
        let email = 'eMaIl';
        if ((userIndex + 1) % 3 === 0) {
            username = testJsutil.oppositeCase(username);
            email = testJsutil.oppositeCase(email);
        }
        let user = {
            username: `${username}_${userIndex}`,
            password: `password_${userIndex}`,
            email: `${email}_${userIndex}@example.com`
        };
        if ((userIndex + 1) % 2 === 0) {
            delete user.username;
        }
        if (override) {
            user = _.assign(user, override);
        }
        return user;
    }

    newQuestion() {
        return this.questionGenerator.newQuestion();
    }

    newSurvey(options) {
        return this.surveyGenerator.newSurvey(options);
    }

    newSurveyQuestionIds(questionIds) {
        return this.surveyGenerator.newSurveyQuestionIds(questionIds);
    }

    answerQuestion(question) {
        if (question.id < 0) {
            return { questionId: -question.id };
        } else {
            return this.answerer.answerQuestion(question);
        }
    }

    answerQuestions(questions) {
        return questions.map(qx => this.answerQuestion(qx));
    }

    newConsentType() {
        const index = ++this.consentTypeIndex;
        return {
            name: `name_${index}`,
            title: `title_${index}`,
            type: `type_${index}`
        };
    }

    newConsentDocument(override) {
        if (!override.typeId) {
            throw new Error('typeId is required');
        }
        const index = ++this.consentDocumentIndex;
        const result = {
            content: `Sample consent section content ${index}`
        };
        const count = this.consentTypeAdded[override.typeId] || 0;
        if (count) {
            result.updateComment = `Update comment ${count}`;
        }
        this.consentTypeAdded[override.typeId] = count + 1;
        Object.assign(result, override);
        return result;
    }

    newConsent(override) {
        if (!override.sections) {
            throw new Error('sections is required.');
        }
        const index = ++this.consentIndex;
        const result = {
            name: `name_${index}`
        };
        Object.assign(result, override);
        return result;
    }

    newAssessment(surveyIds) {
        const index = ++this.assessmentIndex;
        const name = `name_${index}`;
        const sequenceType = (index % 2 === 0) ? 'ondemand' : 'biyearly';
        const lookback = (index % 2 === 1);
        const surveys = surveyIds.map(id => ({ id, lookback }));
        return { name, sequenceType, surveys };
    }

    newEnumeration() {
        const enumerationindex = ++this.enumerationindex;
        const reference = `reference_${enumerationindex}`;
        const numEnumerals = (enumerationindex % 4) + 2;
        const startValue = enumerationindex % 3;
        const enumerals = _.range(numEnumerals).map(index => {
            return {
                text: `text_${enumerationindex}_${index}`,
                value: startValue + index
            };
        });
        return { reference, enumerals };
    }

    nextLanguage() {
        const index = ++this.languageIndex;
        const i4 = index % 4;
        switch (i4) {
        case 2:
            return 'sp';
        case 3:
            return 'en';
        default:
            return null;
        }
    }
}

module.exports = Generator;
