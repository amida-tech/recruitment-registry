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
    reference: 'yes-no-1-2',
    enumerals: [{ text: 'Yes', value: 1 }, { text: 'No', value: 2 }]
}, {
    reference: 'no-yes-1-2',
    enumerals: [{ text: 'No', value: 1 }, { text: 'Yes', value: 2 }]
}, {
    reference: 'yes-no-1-3',
    enumerals: [{ text: 'Yes', value: 1 }, { text: 'No', value: 3 }]
}, {
    reference: 'yes-no-1-0',
    enumerals: [{ text: 'Yes', value: 1 }, { text: 'No', value: 0 }]
}, {
    reference: 'yes-no-0-1',
    enumerals: [{ text: 'Yes', value: 0 }, { text: 'No', value: 1 }]
}, {
    reference: 'yes-no-decline',
    enumerals: [{ text: 'Yes', value: 1 }, { text: 'No', value: 2 }, { text: 'Decline to answer', value: 3 }]
}, {
    reference: 'extended-yes-no',
    enumerals: [
        { text: 'Yes', value: 1 },
        { text: 'No', value: 2 },
        { text: 'I don\'t know', value: 3 },
        { text: 'Decline to answer', value: 4 }
    ]
}, {
    reference: 'weight-ranges-lbs',
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
    reference: 'height-ft-inches',
    enumerals: _.range(4, 8).reduce((r, ft) => {
        _.range(0, 12).forEach(inches => r.push({ text: `${ft}'${inches}"`, value: r.length + 1 }));
        return r;
    }, [])
}, {
    reference: 'marital-status',
    enumerals: [
        { text: 'Divorced', value: 1 },
        { text: 'Domestic Partner', value: 2 },
        { text: 'Married', value: 3 },
        { text: 'Separated', value: 4 },
        { text: 'Single', value: 5 },
        { text: 'Widowed', value: 6 }
    ]
}, {
    reference: 'primary-residence-type',
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
    reference: 'primary-occupation',
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
    reference: 'retirement-year',
    enumerals: _.range(1950, 2017).map((year, index) => ({ text: `${year}`, value: index + 1 }))
}, {
    reference: 'armed-forces-branch',
    enumerals: [
        { text: 'Air Force', value: 1 },
        { text: 'Army', value: 2 },
        { text: 'Coast Guard', value: 3 },
        { text: 'Marines', value: 4 },
        { text: 'National Guard', value: 5 },
        { text: 'Navy', value: 6 }
    ]
}, {
    reference: 'count-0-5-plus',
    enumerals: countEnumerals(5, true)
}, {
    reference: 'count-0-8-plus',
    enumerals: countEnumerals(8, true)
}, {
    reference: 'count-0-10-plus',
    enumerals: countEnumerals(10, true)
}, {
    reference: 'count-0-12-plus',
    enumerals: countEnumerals(10, true)
}, {
    reference: 'count-0-20-plus',
    enumerals: countEnumerals(10, true)
}, {
    reference: 'count-0-7',
    enumerals: countEnumerals(8)
}, {
    reference: 'change-for-worse',
    enumerals: [
        { text: 'Better or no change', value: 1 },
        { text: 'Questionable/ occasionally worse', value: 2 },
        { text: 'Consistently a little worse', value: 3 },
        { text: 'Consistently much worse', value: 4 },
        { text: 'I don\'t know', value: 5 }
    ]
}, {
    reference: 'change-for-worse-2',
    enumerals: [
        { text: 'Better or no change', value: 8 },
        { text: 'Questionable/ occasionally worse', value: 2 },
        { text: 'Consistently a little worse', value: 3 },
        { text: 'Consistently much worse', value: 4 },
        { text: 'I don\'t know', value: 5 }
    ]
}, {
    reference: 'frequency-dwm',
    enumerals: [
        { text: 'Daily', value: 1 },
        { text: 'Weekly', value: 2 },
        { text: 'Monthly', value: 3 },
        { text: 'Almost never', value: 4 }
    ]
}, {
    reference: 'frequency-monthly',
    enumerals: [
        { text: 'Every month', value: 1 },
        { text: 'Every 3 months', value: 2 },
        { text: 'Every 4 months', value: 3 },
        { text: 'Every 6 months', value: 4 },
        { text: 'Once a year', value: 5 }
    ]
}, {
    reference: 'frequency-daily',
    enumerals: [
        { text: 'Not at all', value: 0 },
        { text: 'Several days', value: 1 },
        { text: 'More than half the days', value: 2 },
        { text: 'Nearly every day', value: 3 }
    ]
}, {
    reference: 'frequency-time-6',
    enumerals: [
        { text: 'All of the time', value: 1 },
        { text: 'Most of the time', value: 2 },
        { text: 'No, not limited at al', value: 3 },
        { text: 'Some of the time', value: 4 },
        { text: 'A little of the time', value: 5 },
        { text: 'None of the time', value: 6 }
    ]
}, {
    reference: 'frequency-time-5',
    enumerals: [
        { text: 'All of the time', value: 1 },
        { text: 'Most of the time', value: 2 },
        { text: 'A good bit of the time', value: 3 },
        { text: 'A little of the time', value: 4 },
        { text: 'None of the time', value: 5 }
    ]
}, {
    reference: 'frequency-weekly',
    enumerals: [
        { text: 'Not during the past month', value: 0 },
        { text: 'Less than once a week', value: 1 },
        { text: 'Once or twice a week', value: 2 },
        { text: 'Three or more times a week', value: 3 }
    ]
}, {
    reference: 'confidence-computer',
    enumerals: [
        { text: 'Not confident at all', value: 1 },
        { text: 'I usually need help', value: 2 },
        { text: 'It depends on the task', value: 3 },
        { text: 'Confident', value: 4 }
    ]
}, {
    reference: 'condition',
    enumerals: [
        { text: 'Excellent', value: 1 },
        { text: 'Very Good', value: 2 },
        { text: 'Good', value: 3 },
        { text: 'Fair', value: 4 },
        { text: 'Poor', value: 5 }
    ]
}, {
    reference: 'condition-4',
    enumerals: [
        { text: 'Very good', value: 0 },
        { text: 'Fairly good', value: 1 },
        { text: 'Fairly bad', value: 2 },
        { text: 'Very bad', value: 3 }
    ]
}, {
    reference: 'comparative-condition',
    enumerals: [
        { text: 'Much Better', value: 1 },
        { text: 'Better', value: 2 },
        { text: 'About the Same', value: 3 },
        { text: 'Worse', value: 4 },
        { text: 'Much Worse', value: 5 }
    ]
}, {
    reference: 'comparative-condition-year',
    enumerals: [
        { text: 'Much better now than one year ago', value: 1 },
        { text: 'Somewhat better than one year ago', value: 2 },
        { text: 'About the same', value: 3 },
        { text: 'Somewhat worse now than one year ago', value: 4 },
        { text: 'Much worse now than one year ago', value: 5 }
    ]
}, {
    reference: 'comparative-trouble',
    enumerals: [
        { text: 'Much more trouble', value: 1 },
        { text: 'More trouble', value: 2 },
        { text: 'About the same', value: 3 },
        { text: 'Less trouble', value: 4 },
        { text: 'Much less trouble', value: 5 }
    ]
}, {
    reference: 'fewer-more',
    enumerals: [
        { text: 'Much fewer', value: 1 },
        { text: 'Fewer', value: 2 },
        { text: 'About the same', value: 3 },
        { text: 'More', value: 4 },
        { text: 'Much more', value: 5 }
    ]
}, {
    reference: 'drinks-per-day',
    enumerals: [
        { text: 'Not at all', value: 1 },
        { text: 'Less than 1 drink/day', value: 2 },
        { text: '1-2 drinks/day', value: 3 },
        { text: '3 or more drinks/day', value: 4 }
    ]
}, {
    reference: 'increased-decreased',
    enumerals: [
        { text: 'Increased', value: 1 },
        { text: 'Remained about the same', value: 2 },
        { text: 'Decreased', value: 3 }
    ]
}, {
    reference: 'duration-ym',
    enumerals: [
        { text: 'Years', value: 1 },
        { text: 'Months', value: 2 }
    ]
}, {
    reference: 'duration-ym-1-3',
    enumerals: [
        { text: 'Years', value: 1 },
        { text: 'Months', value: 3 }
    ]
}, {
    reference: 'duration-mh',
    enumerals: [
        { text: 'Less than 30 minutes', value: 1 },
        { text: '30 minutes to 24 hours', value: 2 },
        { text: 'More than 24 hours', value: 3 }
    ]
}, {
    reference: 'difficulty-level',
    enumerals: [
        { text: 'Not Difficult At All', value: 0 },
        { text: 'Somewhat Difficult', value: 1 },
        { text: 'Very Difficult', value: 2 },
        { text: 'Extremely Difficult', value: 3 }
    ]
}, {
    reference: 'impact-cause',
    enumerals: [
        { text: 'Military duty', value: 7 },
        { text: 'Contact sports', value: 8 },
        { text: 'Abuse', value: 9 },
        { text: 'Other', value: 10 }
    ]
}, {
    reference: 'injury-cause',
    enumerals: [
        { text: 'Car Accident', value: 1 },
        { text: 'Other vehicle accident', value: 2 },
        { text: 'Fall', value: 3 },
        { text: 'Sports accident', value: 4 },
        { text: 'Playground accident', value: 5 },
        { text: 'Gunshot', value: 6 },
        { text: 'Fight', value: 7 },
        { text: 'Shaken violently', value: 8 },
        { text: 'Explosion', value: 9 },
        { text: 'Other', value: 10 },
        { text: 'Hit by something', value: 11 }
    ]
}, {
    reference: 'interference',
    enumerals: [
        { text: 'Not at all', value: 1 },
        { text: 'Slightly', value: 2 },
        { text: 'Moderately', value: 3 },
        { text: 'Quite a bit', value: 4 },
        { text: 'Extremely', value: 5 }
    ]
}, {
    reference: 'satisfied',
    enumerals: [
        { text: 'Not at all', value: 1 },
        { text: 'Slightly', value: 2 },
        { text: 'Moderately', value: 3 },
        { text: 'Quite', value: 4 },
        { text: 'Very', value: 5 }
    ]
}, {
    reference: 'severity',
    enumerals: [
        { text: 'Node', value: 1 },
        { text: 'Very mild', value: 2 },
        { text: 'Moderate', value: 3 },
        { text: 'Severe', value: 4 },
        { text: 'Very Severe', value: 5 }
    ]
}, {
    reference: 'how-limited',
    enumerals: [
        { text: 'Yes, limited a lot', value: 1 },
        { text: 'Yes, limited a little', value: 2 },
        { text: 'No, not limited at all', value: 3 }
    ]
}, {
    reference: 'how-true',
    enumerals: [
        { text: 'Definitely True', value: 1 },
        { text: 'Mostly True', value: 2 },
        { text: 'Don\'t Know', value: 3 },
        { text: 'Mostly False', value: 4 },
        { text: 'Definitely False', value: 5 }
    ]
}, {
    reference: 'sleep-time',
    enumerals: [
        { text: 'Before 6:00 PM', value: 1 },
        { text: '6:00 PM', value: 2 },
        { text: '6:30 PM', value: 3 },
        { text: '7:00 PM', value: 4 },
        { text: '7:30 PM', value: 5 },
        { text: '8:00 PM', value: 6 },
        { text: '8:30 PM', value: 7 },
        { text: '9:00 PM', value: 8 },
        { text: '9:30 PM', value: 9 },
        { text: '10:00 PM', value: 10 },
        { text: '10:30 PM', value: 11 },
        { text: '11:00 PM', value: 12 },
        { text: '11:30 PM', value: 13 },
        { text: '12:00 AM', value: 14 },
        { text: '12:30 AM', value: 15 },
        { text: '1:00 AM', value: 16 },
        { text: 'After 1:00 AM', value: 17 }
    ]
}, {
    reference: 'duration-5-minutes',
    enumerals: [
        { text: '< 5 minutes', value: 1 },
        { text: '5 minutes', value: 2 },
        { text: '10 minutes', value: 3 },
        { text: '15 minutes', value: 4 },
        { text: '20 minutes', value: 5 },
        { text: '30 minutes', value: 6 },
        { text: '45 minutes', value: 7 },
        { text: '60 minutes', value: 8 },
        { text: '> 60 minutes', value: 9 }
    ]
}, {
    reference: 'wakeup-time',
    enumerals: [
        { text: 'Before 5:00 AM', value: 1 },
        { text: '5:00 AM', value: 2 },
        { text: '5:30 AM', value: 3 },
        { text: '6:00 AM', value: 4 },
        { text: '6:30 AM', value: 5 },
        { text: '7:00 AM', value: 6 },
        { text: '7:30 AM', value: 7 },
        { text: '8:00 AM', value: 8 },
        { text: '8:30 AM', value: 9 },
        { text: '9:00 AM', value: 10 },
        { text: '9:30 AM', value: 11 },
        { text: '10:00 AM', value: 12 },
        { text: '10:30 AM', value: 13 },
        { text: '11:00 AM', value: 14 },
        { text: 'After 11:00 AM', value: 15 }
    ]
}, {
    reference: 'amount-3-12-.5',
    enumerals: [
        { text: '< 4', value: 1 },
        { text: '4', value: 2 },
        { text: '4.5', value: 3 },
        { text: '5', value: 4 },
        { text: '5.5', value: 5 },
        { text: '6', value: 6 },
        { text: '6.5', value: 7 },
        { text: '7', value: 8 },
        { text: '7.5', value: 9 },
        { text: '8', value: 10 },
        { text: '8.5', value: 11 },
        { text: '9', value: 12 },
        { text: '9.5', value: 13 },
        { text: '10', value: 14 },
        { text: '10.5', value: 15 },
        { text: '11', value: 16 },
        { text: '11.5', value: 17 },
        { text: '12', value: 18 },
        { text: '> 12', value: 19 }
    ]
}, {
    reference: 'much-to-none',
    enumerals: [
        { text: 'Not At All', value: 1 },
        { text: 'Somewhat', value: 2 },
        { text: 'Rather Much', value: 3 },
        { text: 'Very Much', value: 4 }
    ]
}, {
    reference: 'duration-hour',
    enumerals: [
        { text: 'None', value: 1 },
        { text: 'Less than 1 hour', value: 2 },
        { text: '1-2 hours', value: 3 },
        { text: '2-3 hours', value: 4 },
        { text: '3-4 hours', value: 5 },
        { text: '4-5 hours', value: 6 },
        { text: '5-6 hours', value: 7 },
        { text: 'more than 6 hours', value: 8 }
    ]
}, {
    reference: 'is-problem',
    enumerals: [
        { text: 'No problem at all', value: 1 },
        { text: 'Only a very slight problem', value: 2 },
        { text: 'Somewhat of a problem', value: 3 },
        { text: 'A very big problem', value: 4 }
    ]
}, {
    reference: 'is-problem-2',
    enumerals: [
        { text: 'not experienced at all', value: 1 },
        { text: 'no more of a problem', value: 2 },
        { text: 'a mild problem', value: 3 },
        { text: 'a moderate problem', value: 4 },
        { text: 'a severe problem', value: 5 }
    ]
}, {
    reference: 'bed-partner',
    enumerals: [
        { text: 'No bed partner or roommate', value: 1 },
        { text: 'Partner/roommate in other room', value: 2 },
        { text: 'Partner in same room, but not same bed', value: 3 },
        { text: 'Partner in same bed', value: 4 }
    ]
}];
