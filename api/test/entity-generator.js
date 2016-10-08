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
                choice.textValue = `text_${answerIndex}`;
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

class Generator {
    constructor() {
        this.userIndex = -1;

        this.qxTypes = ['text', 'choice', 'choices', 'bool'];
        this.qxIndex = -1;
        this.qxChoiceIndex = 1;
        this.qxChoicesTextSwitch = false;

        this.surveyIndex = -1;
        this.surveyDefaultOptions = { addQuestions: true };

        this.answerer = new Answerer();
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
        const qxIndex = ++this.qxIndex;
        const type = this.qxTypes[qxIndex % 4];
        const question = {
            text: `text_${qxIndex}`,
            type
        };
        if ((type === 'choice') || (type === 'choices')) {
            question.choices = [];
            const qxChoiceIndex = ++this.qxChoiceIndex;
            if (type === 'choices') {
                this.qxChoicesTextSwitch = !this.qxChoicesTextSwitch;
            }
            for (let i = qxChoiceIndex; i < qxChoiceIndex + 5; ++i) {
                const choice = { text: `choice_${i}` };
                if ((type === 'choices') && this.qxChoicesTextSwitch && (i === qxChoiceIndex + 4)) {
                    choice.type = 'text';
                }
                question.choices.push(choice);
            }
        }
        return question;
    }

    newSurvey(options) {
        options = Object.assign({}, this.surveyDefaultOptions, options);
        const surveyIndex = ++this.surveyIndex;
        const name = options.name || `name_${surveyIndex}`;
        const result = { name };
        if (options.addQuestions) {
            result.questions = _.range(5).map(() => this.newQuestion());
            result.questions.forEach((qx, surveyIndex) => (qx.required = Boolean(surveyIndex % 2)));
        }
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
}

module.exports = Generator;
