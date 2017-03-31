'use strict';

const _ = require('lodash');

const Answerer = require('./answerer');
const QuestionGenerator = require('./question-generator');
const SurveyGenerator = require('./survey-generator');

const models = require('../../../models');

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
        this.choiceSetIndex = 0;
        this.researchSiteIndex = 0;
        this.zipCodeApiIndex = 0;
        this.stateIndex = 0;
        this.sectionIndex = -1;
        this.registryIndex = -1;
    }

    updateSurveyGenerator(SurveyGenerator) {
        this.surveyGenerator = this.surveyGenerator.newSurveyGenerator(SurveyGenerator);
    }

    updateAnswererClass(AnswererClass) {
        this.answerer = new AnswererClass(this.answerer);
    }

    newUser(override) {
        this.userIndex += 1;
        const userIndex = this.userIndex;
        let username = 'uSeRnAmE';
        let email = 'eMaIl';
        if ((userIndex + 1) % 3 === 0) {
            username = testJsutil.oppositeCase(username);
            email = testJsutil.oppositeCase(email);
        }
        let user = {
            username: `${username}_${userIndex}`,
            password: `password_${userIndex}`,
            email: `${email}_${userIndex}@example.com`,
        };
        if ((userIndex + 1) % 2 === 0) {
            delete user.username;
        }
        if (override) {
            user = _.assign(user, override);
        }
        if (!user.role) {
            user.role = 'participant';
        }
        if (userIndex % 2 === 1) {
            user.firstname = `firstname_${userIndex}`;
            user.lastname = `lastname_${userIndex}`;
            user.institution = `institution_${userIndex}`;
        }
        return user;
    }

    newQuestion(type, options) {
        return this.questionGenerator.newQuestion(type, options);
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
        }
        return this.answerer.answerQuestion(question);
    }

    answerQuestions(questions) {
        return questions.map(qx => this.answerQuestion(qx));
    }

    answerSurvey(survey) {
        const questions = models.survey.getQuestions(survey);
        return this.answerQuestions(questions);
    }

    newConsentType() {
        this.consentTypeIndex += 1;
        const index = this.consentTypeIndex;
        return {
            name: `name_${index}`,
            title: `title_${index}`,
            type: `type_${index}`,
        };
    }

    newConsentDocument(override) {
        if (!override.typeId) {
            throw new Error('typeId is required');
        }
        this.consentDocumentIndex += 1;
        const index = this.consentDocumentIndex;
        const result = {
            content: `Sample consent section content ${index}`,
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
        this.consentIndex += 1;
        const index = this.consentIndex;
        const result = {
            name: `name_${index}`,
        };
        Object.assign(result, override);
        return result;
    }

    newAssessment(surveyIds) {
        this.assessmentIndex += 1;
        const index = this.assessmentIndex;
        const name = `name_${index}`;
        const sequenceType = (index % 2 === 0) ? 'ondemand' : 'biyearly';
        const lookback = (index % 2 === 1);
        const surveys = surveyIds.map(id => ({ id, lookback }));
        return { name, sequenceType, surveys };
    }

    newChoiceSet() {
        this.choiceSetIndex += 1;
        const choiceSetIndex = this.choiceSetIndex;
        const reference = `reference_${choiceSetIndex}`;
        const numChoices = (choiceSetIndex % 4) + 2;
        const startValue = choiceSetIndex % 3;
        const choices = _.range(numChoices).map(index => ({
            text: `text_${choiceSetIndex}_${index}`,
            code: `${startValue + index}`,
        }));
        return { reference, choices };
    }

    nextLanguage() {
        this.languageIndex += 1;
        const index = this.languageIndex;
        const i4 = index % 4;
        switch (i4) {
        case 2:
            return 'es';
        case 3:
            return 'en';
        default:
            return null;
        }
    }

    newResearchSite(zip, hasOptionalFields) {
        if (hasOptionalFields === undefined) {
            hasOptionalFields = false;
        }
        this.researchSiteIndex += 1;
        const index = this.researchSiteIndex;
        const withOptionalFields = {
            name: `name_${index}`,
            url: `server_${index}@example.com`,
            street: `street_${index}`,
            street2: `suite_${index}`,
            city: `city_${index}`,
            state: this.newState(index),
            zip,
        };
        const withoutOptionalFields = {
            name: `name_${index}`,
            url: `server_${index}@example.com`,
            street: `street_${index}`,
            city: `city_${index}`,
            state: this.newState(index),
            zip,
        };
        return (hasOptionalFields ? withOptionalFields : withoutOptionalFields);
    }

    newZipCodeApiObject(zip) {
        this.zipCodeApiIndex += 1;
        const index = this.zipCodeApiIndex;
        return {
            zip,
            city: `city_${index}`,
            state: this.newState(index),
            distance: index + 1,
        };
    }

    newState(index) {
        let stateIndex = index;
        if (stateIndex === undefined) {
            this.stateIndex += 1;
            stateIndex = this.stateIndex;
        }
        return ['MA', 'MD', 'ID', 'VA', 'GA'][stateIndex % 5];
    }

    newSection() {
        this.sectionIndex += 1;
        const index = this.sectionIndex;
        const type = index % 3;
        const result = (index % 2) ? { meta: { type: index } } : {};
        if (type === 0) {
            Object.assign(result, { name: `name_${index}` });
        } else if (type === 2) {
            const description = `description_${index}`;
            Object.assign(result, { name: `name_${index}`, description });
        }
        return result;
    }

    newRegistry() {
        this.registryIndex += 1;
        const index = this.registryIndex;
        const registry = { name: `name_${index}` };
        if (index % 2) {
            registry.url = `https://example.com/api_${index}`;
        } else {
            registry.schema = `schema_${index}`;
        }
        return registry;
    }
}

module.exports = Generator;
