'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const surveys = require('./surveys');

module.exports = [{
    surveyIndex: 0,
    survey: surveys.travelSurvey,
    purpose: 'completeSurvey',
}, {
    surveyIndex: 1,
    questionIndex: 5,
    type: 'text',
    purpose: 'enableWhen',
    logic: 'not-equals',
    relativeIndex: 1,
}, {
    surveyIndex: 2,
    questionIndex: 2,
    type: 'choice',
    purpose: 'type',
}, {
    surveyIndex: 2,
    questionIndex: 3,
    type: 'choice',
    purpose: 'enableWhen',
    logic: 'equals',
    relativeIndex: 1,
}, {
    surveyIndex: 3,
    questionIndex: 3,
    type: 'choice',
    logic: 'not-equals',
    count: 3,
    purpose: 'questionSection',
}, {
    surveyIndex: 4,
    questionIndex: 5,
    type: 'choice',
    logic: 'equals',
    count: 1,
    purpose: 'questionSection',
}, {
    surveyIndex: 5,
    questionIndex: 3,
    type: 'bool',
    logic: 'equals',
    count: 2,
    purpose: 'questionSection',
}, {
    surveyIndex: 6,
    questionIndex: 0,
    type: 'text',
    logic: 'not-exists',
    count: 1,
    purpose: 'questionSection',
}, {
    surveyIndex: 7,
    questionIndex: 2,
    type: 'text',
    logic: 'exists',
    count: 2,
    purpose: 'questionSection',
}];
