'use strict';

const _ = require('lodash');

class Answerer {
    constructor() {
        this.answerIndex = -1;
        this.answerChoicesCountIndex = 0;
    }

    text(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                textValue: `text_${answerIndex}`
            }
        };
    }

    bool(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                boolValue: answerIndex % 2 === 0
            }
        };
    }

    choice(question) {
        const answerIndex = ++this.answerIndex;
        const choice = question.choices[answerIndex % question.choices.length];
        return {
            questionId: question.id,
            answer: {
                choice: choice.id
            }
        };
    }

    choices(question) {
        ++this.answerIndex;
        this.answerChoicesCountIndex = (this.answerChoicesCountIndex + 1) % 3;
        const choices = _.range(this.answerChoicesCountIndex + 1).map(() => {
            const answerIndex = ++this.answerIndex;
            const choice = question.choices[answerIndex % question.choices.length];
            const answer = {
                id: choice.id
            };
            if (choice.type === 'text') {
                answer.textValue = `text_${answerIndex}`;
            }
            return answer;
        });

        return {
            questionId: question.id,
            answer: {
                choices: _.sortBy(choices, 'id')
            }
        };
    }
}

class QuestionGenerator {
    constructor() {
        this.types = ['text', 'choice', 'choices', 'bool'];
        this.index = -1;

        this.choiceIndex = 0;

        this.typeChoiceIndex = -1;

        this.typeChoicesIndex = -1;
    }

    _body(type) {
        const index = ++this.index;
        return { text: `text_${index}`, type };
    }

    _choices() {
        const startIndex = this.choiceIndex;
        const endIndex = this.choiceIndex + 5;
        this.choiceIndex = endIndex;
        return _.range(startIndex, endIndex).map(i => `choice_${i}`);
    }

    text() {
        return this._body('text');
    }

    bool() {
        return this._body('bool');
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

    newActions(index, count) {
        return _.range(count).map(i => {
            const text = `text_${index}_${i}`;
            const type = `type_${index}_${i}`;
            return { text, type };
        });
    }

    newQuestion() {
        const type = this.types[(this.index + 1) % 4];
        const result = this[type]();
        const actionCount = (this.index % 5) - 1;
        if (actionCount > 0) {
            result.actions = this.newActions(this.index, actionCount);
        }
        return result;
    }
}

class Generator {
    constructor() {
        this.userIndex = -1;
        this.questionGenerator = new QuestionGenerator();
        this.surveyIndex = -1;
        this.answerer = new Answerer();
        this.consentSectionTypeIndex = -1;
        this.consentSectionIndex = -1;
        this.consentSectionTypeAdded = {};
    }

    newUser(override) {
        const userIndex = ++this.userIndex;
        let user = {
            username: 'username_' + userIndex,
            password: 'password_' + userIndex,
            email: 'email_' + userIndex + '@example.com'
        };
        if (override) {
            user = _.assign(user, override);
        }
        return user;
    }

    newQuestion() {
        return this.questionGenerator.newQuestion();
    }

    newSurvey(override = {}) {
        const surveyIndex = ++this.surveyIndex;
        const name = override.name || `name_${surveyIndex}`;
        const result = { name };
        if (override.questions) {
            result.questions = override.questions;
        } else {
            result.questions = _.range(5).map(() => this.newQuestion());
            result.questions.forEach((qx, surveyIndex) => (qx.required = Boolean(surveyIndex % 2)));
        }
        return result;
    }

    newSurveyQuestionIds(questionIds) {
        const surveyIndex = ++this.surveyIndex;
        const name = `name_${surveyIndex}`;
        const result = { name };
        result.questions = questionIds.map(id => ({ id, required: Boolean(surveyIndex % 2) }));
        return result;
    }

    answerQuestion(question) {
        if (question.id < 0) {
            return { questionId: -question.id };
        } else {
            return this.answerer[question.type](question);
        }
    }

    answerQuestions(questions) {
        return questions.map(qx => this.answerQuestion(qx));
    }

    newConsentSectionType() {
        const index = ++this.consentSectionTypeIndex;
        return {
            name: `name_${index}`,
            title: `title_${index}`,
            type: `type_${index}`
        };
    }

    newConsentSection(override) {
        if (!override.typeId) {
            throw new Error('typeId is required');
        }
        const index = ++this.consentSectionIndex;
        const result = {
            content: `Sample consent section content ${index}`
        };
        const count = this.consentSectionTypeAdded[override.typeId] || 0;
        if (count) {
            result.updateComment = `Update comment ${count}`;
        }
        this.consentSectionTypeAdded[override.typeId] = count + 1;
        Object.assign(result, override);
        return result;
    }
}

module.exports = Generator;
