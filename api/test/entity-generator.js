'use strict';

const _ = require('lodash');

exports.genNewUser = (function () {
    let index = -1;

    return function (override) {
        ++index;
        let user = {
            username: 'username_' + index,
            password: 'password_' + index,
            email: 'email_' + index + '@example.com'
        };
        if (override) {
            user = _.assign(user, override);
        }
        return user;
    };
})();

exports.genNewQuestion = (function () {
    const types = ['text', 'choice', 'choices', 'bool'];
    let index = -1;
    let choiceIndex = 1;
    let choicesTextSwitch = false;

    return function () {
        ++index;
        const type = types[index % 4];
        const question = {
            text: `text_${index}`,
            type,
            selectable: (index % 2 === 0)
        };
        if ((type === 'choice') || (type === 'choices')) {
            question.choices = [];
            ++choiceIndex;
            if (type === 'choices') {
                choicesTextSwitch = !choicesTextSwitch;
            }
            for (let i = choiceIndex; i < choiceIndex + 5; ++i) {
                const choice = { text: `choice_${i}` };
                if ((type === 'choices') && choicesTextSwitch && (i === choiceIndex + 4)) {
                    choice.type = 'text';
                }
                question.choices.push(choice);
            }
        }
        return question;
    };
})();

exports.genNewSurvey = (function () {
    let index = -1;
    const defaultOptions = {
        released: true,
        addQuestions: true
    };
    return function (inputOptions = {}) {
        const options = Object.assign({}, defaultOptions, inputOptions);
        ++index;
        const result = { name: `name_${index}` };
        result.released = options.released;
        if (options.addQuestions) {
            result.questions = _.range(5).map(() => ({ content: exports.genNewQuestion() }));
        }
        return result;
    };
})();
