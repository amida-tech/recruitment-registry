'use strict';

const _ = require('lodash');

const getValueAnswerGenerator = (function () {
    const fns = {
        text(value) { return { textValue: value }; },
        zip(value) { return { textValue: value }; },
        date(value) { return { dateValue: value }; },
        year(value) { return { yearValue: value }; },
        month(value) { return { monthValue: value }; },
        day(value) { return { dayValue: value }; },
        bool(value) { return { boolValue: value === 'true' }; },
        pounds(value) { return { numberValue: parseInt(value, 10) }; },
        integer(value) { return { integerValue: parseInt(value, 10) }; },
        float(value) { return { integerValue: parseFloat(value) }; },
        bloodPressure(value) {
            const pieces = value.split('-');
            return {
                bloodPressureValue: {
                    systolic: parseInt(pieces[0], 10),
                    diastolic: parseInt(pieces[1], 10),
                },
            };
        },
        feetInches: (value) => {
            const pieces = value.split('-');
            return {
                feetInchesValue: {
                    feet: parseInt(pieces[0], 10),
                    inches: parseInt(pieces[1], 10),
                },
            };
        },
    };

    return function (type) {
        const typeCamelCase = _.camelCase(type);
        return fns[typeCamelCase];
    };
}());

const getChoiceAnswerGenerator = (function () {
    const fns = {
        choice(entries) { return { choice: entries[0].questionChoiceId }; },
        openChoice(entries) {
            const choice = entries[0].questionChoiceId;
            if (choice) {
                return { choice };
            }
            return { textValue: entries[0].value };
        },
        choiceRef(entries) { return { choice: entries[0].questionChoiceId }; },
        choices(entries) {
            let choices = entries.map((r) => {
                const answer = { id: r.questionChoiceId };
                const fn = getValueAnswerGenerator(r.choiceType || 'bool');
                return Object.assign(answer, fn(r.value));
            });
            choices = _.sortBy(choices, 'id');
            return { choices };
        },
    };

    return function (type) {
        const typeCamelCase = _.camelCase(type);
        return fns[typeCamelCase];
    };
}());

const generateAnswer = function (type, entries, multiple) {
    if (multiple) {
        const fn = getValueAnswerGenerator(type);
        const result = entries.map((entry) => {
            const answer = { multipleIndex: entry.multipleIndex };
            if (type === 'choice' || type === 'open-choice') {
                const fnChoice = getChoiceAnswerGenerator(type);
                Object.assign(answer, fnChoice([entry]));
            } else {
                Object.assign(answer, fn(entry.value));
            }
            return answer;
        });
        return _.sortBy(result, 'multipleIndex');
    }
    const fnChoices = getChoiceAnswerGenerator(type);
    if (fnChoices) {
        return fnChoices(entries);
    }
    const fn = getValueAnswerGenerator(type);
    return fn(entries[0].value);
};

const getFilterAnswerGenerator = (function () {
    const fns = {
        choice(answer) { return { choice: answer.questionChoiceId }; },
        openChoice(answer) {
            const choice = answer.questionChoiceId;
            if (choice) {
                return { choice };
            }
            return { textValue: answer.value };
        },
        choiceRef(answer) { return { choice: answer.questionChoiceId }; },
        choices(answer, choiceType) {
            const result = { choice: answer.questionChoiceId };
            if (choiceType && choiceType !== 'bool') {
                const fn = getValueAnswerGenerator(choiceType);
                Object.assign(result, fn(answer.value));
            }
            return result;
        },
    };

    const fnValue = function (type) {
        const fn = getValueAnswerGenerator(type);
        return function (answer) {
            return fn(answer.value);
        };
    };

    return function (type) {
        const typeCamelCase = _.camelCase(type);
        const fn = fns[typeCamelCase];
        if (fn) {
            return fn;
        }
        return fnValue(type);
    };
}());

const generateFilterAnswers = function (type, answers, choiceType) {
    const fn = getFilterAnswerGenerator(type);
    return answers.map(answer => fn(answer, choiceType));
};

module.exports = {
    generateAnswer,
    generateFilterAnswers,
};
