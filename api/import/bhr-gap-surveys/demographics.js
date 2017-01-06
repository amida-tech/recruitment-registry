'use strict';

const _ = require('lodash');

module.exports = {
    name: 'Demographics',
    questions: [{
        text: 'What is your weight (lbs)?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID177',
        choices: [
			{ text: '110-' },
			{ text: '110-119' },
			{ text: '120-129' },
			{ text: '130-139' },
			{ text: '140-149' },
			{ text: '150-159' },
			{ text: '160-169' },
			{ text: '170-179' },
			{ text: '180-189' },
			{ text: '190-199' },
			{ text: '200-209' },
			{ text: '210-219' },
			{ text: '220-229' },
			{ text: '230-239' },
			{ text: '240-249' },
			{ text: '250-259' },
			{ text: '260-269' },
			{ text: '270-279' },
			{ text: '280-289' },
			{ text: '290-299' },
			{ text: '300-309' },
			{ text: '310+' }
        ]
    }, {
        text: 'What is your height (ft\'in")?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID177',
        choices: _.range(4, 8).reduce((r, ft) => {
        	_.range(0, 12).forEach(inches => r.push({ text: `${ft}'${inches}"` }));
        	return r;
        }, [])
    }, {
        text: 'What is your current marital status?',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID180',
        choices: [
			{ text: 'Divorced' },
			{ text: 'Domestic Partner' },
			{ text: 'Married' },
			{ text: 'Separated' },
			{ text: 'Single' },
			{ text: 'Widowed' }
        ]
    }, {
        text: 'Please indicate your primary residence type',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID189',
        choices: [
			{ text: 'House' },
			{ text: 'Condo/Co-op (owned)' },
			{ text: 'Apartment (rented)' },
			{ text: 'Mobile Home' },
			{ text: 'Retirement Community' },
			{ text: 'Assisted Living' },
			{ text: 'Skilled Nursing Facility' },
			{ text: 'Other' }
        ]
    }, {
        text: 'What is/was the field of your primary occupation during most of adult life',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID182',
        skip: {
        	count: 2,
        	rule: {
        		logic: 'equals',
        		answer: '*Other'
        	}
        },
        choices: [
			{ text: 'Agriculture, Forestry, Fishing, or Hunting' },
			{ text: 'Arts, Entertainment, or Recreation' },
			{ text: 'Broadcasting' },
			{ text: 'Education - College, University, or Adult' },
			{ text: 'Education - Primary/Secondary (K-12)' },
			{ text: 'Education - Other' },
			{ text: 'Construction' },
			{ text: 'Finance and Insurance' },
			{ text: 'Government and Public Administration' },
			{ text: 'Health Care and Social Assistance' },
			{ text: 'Homemaker' },
			{ text: 'Hotel and Food Services' },
			{ text: 'Information - Services and Data' },
			{ text: 'Information - Other' },
			{ text: 'Processing' },
			{ text: 'Legal Services' },
			{ text: 'Manufacturing - Computer and Electronics' },
			{ text: 'Manufacturing - Other' },
			{ text: 'Military' },
			{ text: 'Mining' },
			{ text: 'Publishing' },
			{ text: 'Real Estate, Rental, or Leasing' },
			{ text: 'Religious' },
			{ text: 'Retail' },
			{ text: 'Scientific or Technical Services' },
			{ text: 'Software' },
			{ text: 'Telecommunications' },
			{ text: 'Transportation and Warehousing' },
			{ text: 'Utilities' },
			{ text: 'Wholesale' },
			{ text: '*Other' }
        ]
    }, {
        text: 'Please indicate *Other occupation',
        required: false,
        type: 'text',
        answerIdentifier: 'QID183'
    }, {
        text: 'Please indicate your role in your primary occupational industry',
        required: false,
        type: 'choices',
        choices: [
            { text: 'Upper management', answerIdentifier: 'QID184_1' },
            { text: 'Middle management', answerIdentifier: 'QID184_2' },
            { text: 'Junior management', answerIdentifier: 'QID184_3' },
            { text: 'Administrative staff', answerIdentifier: 'QID184_4' },
            { text: 'Support staff', answerIdentifier: 'QID184_5' },
            { text: 'Student', answerIdentifier: 'QID184_6' },
            { text: 'Trained professional', answerIdentifier: 'QID184_7' },
            { text: 'Skilled laborer', answerIdentifier: 'QID184_8' },
            { text: 'Consultant', answerIdentifier: 'QID184_9' },
            { text: 'Temporary employee', answerIdentifier: 'QID184_10' },
            { text: 'Researcher', answerIdentifier: 'QID184_11' },
            { text: 'Self-employed', answerIdentifier: 'QID184_12' },
            { text: 'Other', answerIdentifier: 'QID184_13' }
		]
    }, {
        text: 'Are you retired?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID185',
        skip: {
        	count: 1,
        	rule: {
        		logic: 'equals',
        		answer: 'Yes'
        	}
        },
        choices: [
            { text: 'Yes' },
            { text: 'No' }
        ]
    }, {
        text: 'Year of retirement',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID186',
        choices: _.range(1950, 2017).map(year => `${year}`)
    }, {
        text: 'Are you a veteran of the Armed Forces?',
        required: true,
        type: 'choice',
        answerIdentifier: 'QID192',
        skip: {
        	count: 1,
        	rule: {
        		logic: 'equals',
        		answer: 'Yes'
        	}
        },
        choices: [
            { text: 'Yes' },
            { text: 'No' }
        ]
    }, {
        text: 'Please indicate which branch of the Armed Forces',
        required: false,
        type: 'choice',
        answerIdentifier: 'QID193',
        choices: [
			{ text: 'Air Force' },
			{ text: 'Army' },
			{ text: 'Coast Guard' },
			{ text: 'Marines' },
			{ text: 'National Guard' },
			{ text: 'Navy' }
        ]
    }]
};
