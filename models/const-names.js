'use strict';

const smtpTypes = ['reset-password', 'cohort-csv'];

const feedbackSurveyType = 'feedback';
const surveyTypes = ['normal', feedbackSurveyType];

const participantRole = 'participant';
const clinicianRole = 'clinician';

module.exports = {
    smtpTypes,
    surveyTypes,
    defaultSurveyType: surveyTypes[0],
    feedbackSurveyType,
    participantRole,
    clinicianRole,
    consentRoles: [participantRole, clinicianRole],
};
