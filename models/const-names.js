'use strict';

const smtpTypes = ['reset-password', 'cohort-csv'];

const surveyTypes = ['normal', 'feedback'];

module.exports = {
    smtpTypes,
    surveyTypes,
    defaultSurveyType: surveyTypes[0],
};
