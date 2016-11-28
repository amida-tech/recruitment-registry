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

    zip(question) {
        const answerIndex = ++this.answerIndex;
        const zip = ['20850', '53727', '76333', '74747'][answerIndex % 4];
        return {
            questionId: question.id,
            answer: {
                textValue: zip
            }
        };
    }

    'blood-pressure' (question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                bloodPressureValue: {
                    systolic: 100 + (answerIndex % 40),
                    diastolic: 70 + (answerIndex % 20)
                }
            }
        };
    }

    'feet-inches' (question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                feetInchesValue: {
                    feet: 5 + (answerIndex % 2),
                    inches: answerIndex % 12
                }
            }
        };
    }

    date(question) {
        const answerIndex = ++this.answerIndex;
        const month = answerIndex % 8 + 1;
        const day = answerIndex % 13 + 10;
        const year = answerIndex % 34 + 1970;
        return {
            questionId: question.id,
            answer: {
                dateValue: `${year}-0${month}-${day}`
            }
        };
    }

    year(question) {
        const answerIndex = ++this.answerIndex;
        const year = answerIndex % 34 + 1980;
        return {
            questionId: question.id,
            answer: {
                yearValue: `${year}`
            }
        };
    }

    month(question) {
        const answerIndex = ++this.answerIndex;
        const month = answerIndex % 8 + 1;
        return {
            questionId: question.id,
            answer: {
                monthValue: `0${month}`
            }
        };
    }

    day(question) {
        const answerIndex = ++this.answerIndex;
        const day = answerIndex % 13 + 10;
        return {
            questionId: question.id,
            answer: {
                dayValue: `${day}`
            }
        };
    }

    integer(question) {
        const answerIndex = ++this.answerIndex;
        return {
            questionId: question.id,
            answer: {
                integerValue: answerIndex
            }
        };
    }

    pounds(question) {
        const answerIndex = ++this.answerIndex;
        const numberValue = 100 + answerIndex;
        return {
            questionId: question.id,
            answer: {
                numberValue
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
        this.types = [
            'text', 'choice', 'choices', 'bool', 'integer',
            'zip', 'date', 'year', 'month', 'day', 'pounds',
            'feet-inches', 'blood-pressure'
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
}

class Generator {
    constructor() {
        this.userIndex = -1;
        this.questionGenerator = new QuestionGenerator();
        this.surveyIndex = -1;
        this.answerer = new Answerer();
        this.consentTypeIndex = -1;
        this.consentDocumentIndex = -1;
        this.consentTypeAdded = {};
        this.consentIndex = -1;
        this.languageIndex = -1;
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
        if (surveyIndex % 2 === 0) {
            result.description = `description_${surveyIndex}`;
        }
        const metaIndex = surveyIndex % 3;
        if (metaIndex > 0) {
            result.meta = {
                displayAsWizard: metaIndex === 1,
                saveProgress: metaIndex === 2
            };
        }
        if (override.questions) {
            result.questions = override.questions;
            if (override.sections) {
                result.section = override.sections;
            }
        } else {
            const sectionType = this.surveyIndex % 3;
            const count = sectionType ? 9 + sectionType - 1 : this.questionGenerator.types.length + 1;
            result.questions = _.range(count).map(() => this.newQuestion());
            result.questions.forEach((qx, surveyIndex) => (qx.required = Boolean(surveyIndex % 2)));
            if (sectionType) {
                const sections = Array(3);
                sections[0] = { name: 'section_0', indices: _.range(0, 6, 2) };
                sections[1] = { name: 'section_1', indices: _.range(1, 6, 2) };
                sections[2] = { name: 'section_2', indices: _.rangeRight(count - 3, count) };
                result.sections = sections;
            }
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
