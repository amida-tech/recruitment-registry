'use strict';

const _ = require('lodash');

const countEnumerals = function (count, plus) {
    const result = _.range(0, count).map(index => ({ text: `${index}`, code: `${index + 1}` }));
    if (plus) {
        result.push({ text: `${count}+`, code: `${count + 1}` });
    }
    return result;
};

module.exports = [{
    reference: 'yes-no-1-2',
    enumerals: [{ text: 'Yes', code: '1' }, { text: 'No', code: '2' }]
}, {
    reference: 'count-0-8-plus',
    enumerals: countEnumerals(8, true)
}, {
    reference: 'condition',
    enumerals: [
        { text: 'Excellent', code: '1' },
        { text: 'Very Good', code: '2' },
        { text: 'Good', code: '3' },
        { text: 'Fair', code: '4' },
        { text: 'Poor', code: '5' }
    ]
}, {
    reference: 'primary-occupation',
    enumerals: [
        { text: 'Agriculture', code: '5' },
        { text: 'Arts', code: '7' },
        { text: 'Broadcasting', code: '8' },
        { text: 'Education', code: '9' },
        { text: 'Construction', code: '10' },
        { text: 'Finance', code: '11' },
        { text: 'Other', code: '20' }
    ]
}];
