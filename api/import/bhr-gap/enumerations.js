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
    name: 'weight-ranges-lbs',
    enumerals: [
        { text: '110-', value: 1 },
        { text: '110-119', value: 2 },
        { text: '120-129', value: 3 },
        { text: '130-139', value: 4 },
        { text: '140-149', value: 5 },
        { text: '150-159', value: 6 },
        { text: '160-169', value: 7 },
        { text: '170-179', value: 8 },
        { text: '180-189', value: 9 },
        { text: '190-199', value: 10 },
        { text: '200-209', value: 11 },
        { text: '210-219', value: 12 },
        { text: '220-229', value: 13 },
        { text: '230-239', value: 14 },
        { text: '240-249', value: 15 },
        { text: '250-259', value: 16 },
        { text: '260-269', value: 17 },
        { text: '270-279', value: 18 },
        { text: '280-289', value: 19 },
        { text: '290-299', value: 20 },
        { text: '300-309', value: 21 },
        { text: '310+', value: 22 }
    ]
}, {
    name: 'height-ft-inches',
    enumerals: _.range(4, 8).reduce((r, ft) => {
        _.range(0, 12).forEach(inches => r.push({ text: `${ft}'${inches}"`, value: r.length + 1 }));
        return r;
    }, [])
}, {
    name: 'marital-status',
    enumerals: [
        { text: 'Divorced', value: 1 },
        { text: 'Domestic Partner', value: 2 },
        { text: 'Married', value: 3 },
        { text: 'Separated', value: 4 },
        { text: 'Single', value: 5 },
        { text: 'Widowed', value: 6 }
    ]
}, {
    name: 'primary-residence-type',
    enumerals: [
        { text: 'House', value: 1 },
        { text: 'Condo/Co-op (owned)', value: 2 },
        { text: 'Apartment (rented)', value: 3 },
        { text: 'Mobile Home', value: 4 },
        { text: 'Retirement Community', value: 5 },
        { text: 'Assisted Living', value: 6 },
        { text: 'Skilled Nursing Facility', value: 7 },
        { text: 'Other', value: 8 }
    ]
}, {
    name: 'primary-occupation',
    enumerals: [
        { text: 'Agriculture, Forestry, Fishing, or Hunting', value: 1 },
        { text: 'Arts, Entertainment, or Recreation', value: 2 },
        { text: 'Broadcasting', value: 3 },
        { text: 'Education - College, University, or Adult', value: 4 },
        { text: 'Education - Primary/Secondary (K-12)', value: 5 },
        { text: 'Education - Other', value: 6 },
        { text: 'Construction', value: 7 },
        { text: 'Finance and Insurance', value: 8 },
        { text: 'Government and Public Administration', value: 9 },
        { text: 'Health Care and Social Assistance', value: 10 },
        { text: 'Homemaker', value: 11 },
        { text: 'Hotel and Food Services', value: 12 },
        { text: 'Information - Services and Data', value: 13 },
        { text: 'Information - Other', value: 14 },
        { text: 'Processing', value: 15 },
        { text: 'Legal Services', value: 16 },
        { text: 'Manufacturing - Computer and Electronics', value: 7 },
        { text: 'Manufacturing - Other', value: 18 },
        { text: 'Military', value: 19 },
        { text: 'Mining', value: 20 },
        { text: 'Publishing', value: 21 },
        { text: 'Real Estate, Rental, or Leasing', value: 22 },
        { text: 'Religious', value: 23 },
        { text: 'Retail', value: 24 },
        { text: 'Scientific or Technical Services', value: 25 },
        { text: 'Software', value: 26 },
        { text: 'Telecommunications', value: 27 },
        { text: 'Transportation and Warehousing', value: 28 },
        { text: 'Utilities', value: 29 },
        { text: 'Wholesale', value: 30 },
        { text: '*Other', value: 31 }
    ]
}, {
    name: 'retirement-year',
    enumerals: _.range(1950, 2017).map((year, index) => ({ text: `${year}`, value: index + 1 }))
}, {
    name: 'armed-forces-branch',
    enumerals: [
        { text: 'Air Force', value: 1 },
        { text: 'Army', value: 2 },
        { text: 'Coast Guard', value: 3 },
        { text: 'Marines', value: 4 },
        { text: 'National Guard', value: 5 },
        { text: 'Navy', value: 6 }
    ]
}, {
    name: 'count-0-5-plus',
    enumerals: countEnumerals(5, true)
}, {
    name: 'count-0-8-plus',
    enumerals: countEnumerals(8, true)
}, {
    name: 'count-0-10-plus',
    enumerals: countEnumerals(10, true)
}, {
    name: 'count-0-12-plus',
    enumerals: countEnumerals(10, true)
}, {
    name: 'count-0-20-plus',
    enumerals: countEnumerals(10, true)
}, {
    name: 'count-0-7',
    enumerals: countEnumerals(8)
}, {
    name: 'change-for-worse',
    enumerals: [
        { text: 'Better or no change', value: 1 },
        { text: 'Questionable/ occasionally worse', value: 2 },
        { text: 'Consistently a little worse', value: 3 },
        { text: 'Consistently much worse', value: 4 },
        { text: 'I don\'t know', value: 5 }
    ]
}, {
    name: 'change-for-worse-2',
    enumerals: [
        { text: 'Better or no change', value: 8 },
        { text: 'Questionable/ occasionally worse', value: 2 },
        { text: 'Consistently a little worse', value: 3 },
        { text: 'Consistently much worse', value: 4 },
        { text: 'I don\'t know', value: 5 }
    ]
}];
