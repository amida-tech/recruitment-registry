'use strict';

const smtpTypes = ['reset-password', 'cohort-csv'];

const feedbackSurveyType = 'feedback';
const surveyTypes = ['normal', feedbackSurveyType];

module.exports = {
    smtpTypes,
    surveyTypes,
    defaultSurveyType: surveyTypes[0],
    feedbackSurveyType,
};
