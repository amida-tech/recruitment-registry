'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

const countChoices = function (count, plus) {
    const result = _.range(0, count).map(index => ({ text: `${index}`, code: `${index + 1}` }));
    if (plus) {
        result.push({ text: `${count}+`, code: `${count + 1}` });
    }
    return result;
};

module.exports = [{
    reference: 'yes-no-1-2',
    choices: [{ text: 'Yes', code: '1' }, { text: 'No', code: '2' }],
}, {
    reference: 'count-0-8-plus',
    choices: countChoices(8, true),
}, {
    reference: 'count-0-3-plus',
    choices: countChoices(3, true),
}, {
    reference: 'condition',
    choices: [
        { text: 'Excellent', code: '1' },
        { text: 'Very Good', code: '2' },
        { text: 'Good', code: '3' },
        { text: 'Fair', code: '4' },
        { text: 'Poor', code: '5' },
    ],
}, {
    reference: 'primary-occupation',
    choices: [
        { text: 'Agriculture', code: '5' },
        { text: 'Arts', code: '7' },
        { text: 'Broadcasting', code: '8' },
        { text: 'Education', code: '9' },
        { text: 'Construction', code: '10' },
        { text: 'Finance', code: '11' },
        { text: 'Other', code: '20' },
    ],
}];
