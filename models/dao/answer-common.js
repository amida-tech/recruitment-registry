'use strict';

const _ = require('lodash');

const generateAnswerSingleFn = {
    text: value => ({ textValue: value }),
    zip: value => ({ textValue: value }),
    date: value => ({ dateValue: value }),
    year: value => ({ yearValue: value }),
    month: value => ({ monthValue: value }),
    day: value => ({ dayValue: value }),
    bool: value => ({ boolValue: value === 'true' }),
    'bool-sole': value => ({ boolValue: value === 'true' }),
    pounds: value => ({ numberValue: parseInt(value) }),
    integer: value => ({ integerValue: parseInt(value) }),
    float: value => ({ integerValue: parseFloat(value) }),
    'blood-pressure': (value) => {
        const pieces = value.split('-');
        return {
            bloodPressureValue: {
                systolic: parseInt(pieces[0]),
                diastolic: parseInt(pieces[1]),
            },
        };
    },
    'feet-inches': (value) => {
        const pieces = value.split('-');
        return {
            feetInchesValue: {
                feet: parseInt(pieces[0]),
                inches: parseInt(pieces[1]),
            },
        };
    },
};

const generateAnswerChoices = {
    choice: entries => ({ choice: entries[0].questionChoiceId }),
    'choice-ref': entries => ({ choice: entries[0].questionChoiceId }),
    choices: (entries) => {
        let choices = entries.map((r) => {
            const answer = { id: r.questionChoiceId };
            const fn = generateAnswerSingleFn[r.choiceType || 'bool'];
            return Object.assign(answer, fn(r.value));
        });
        choices = _.sortBy(choices, 'id');
        return { choices };
    },
};

const generateAnswer = function (type, entries, multiple) {
    if (multiple) {
        const fn = generateAnswerSingleFn[type];
        const result = entries.map((entry) => {
            const answer = { multipleIndex: entry.multipleIndex };
            if (type === 'choice') {
                Object.assign(answer, generateAnswerChoices.choice([entry]));
            } else {
                Object.assign(answer, fn(entry.value));
            }
            return answer;
        });
        return _.sortBy(result, 'multipleIndex');
    }
    const fnChoices = generateAnswerChoices[type];
    if (fnChoices) {
        return fnChoices(entries);
    }
    const fn = generateAnswerSingleFn[type];
    return fn(entries[0].value);
};

module.exports = {
    generateAnswer,
};
