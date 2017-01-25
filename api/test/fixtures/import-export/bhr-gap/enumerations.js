'use strict';

const _ = require('lodash');

const countEnumerals = function (count, plus) {
    const result = _.range(0, count).map(index => ({ text: `${index}`, value: index + 1 }));
    if (plus) {
        result.push({ text: `${count}+`, value: count + 1 });
    }
    return result;
};

module.exports = [{
    name: 'yes-no-1-2',
    enumerals: [{ text: 'Yes', value: 1 }, { text: 'No', value: 2 }]
}, {
    name: 'count-0-8-plus',
    enumerals: countEnumerals(8, true)
}, {
    name: 'condition',
    enumerals: [
        { text: 'Excellent', value: 1 },
        { text: 'Very Good', value: 2 },
        { text: 'Good', value: 3 },
        { text: 'Fair', value: 4 },
        { text: 'Poor', value: 5 }
    ]
}, {
    name: 'primary-occupation',
    enumerals: [
        { text: 'Agriculture', value: 5 },
        { text: 'Arts', value: 7 },
        { text: 'Broadcasting', value: 8 },
        { text: 'Education', value: 9 },
        { text: 'Construction', value: 10 },
        { text: 'Finance', value: 11 },
        { text: 'Other', value: 20 }
    ]
}];
