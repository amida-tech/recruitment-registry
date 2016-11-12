'use strict';

const User = require('./user.dao');
const QuestionChoice = require('./question-choice.dao');
const QuestionAction = require('./question-action.dao');
const Question = require('./question.dao');
const Answer = require('./answer.dao');
const Survey = require('./survey.dao');
const ConsentType = require('./consent-type.dao');
const ConsentDocument = require('./consent-document.dao');
const ConsentSignature = require('./consent-signature.dao');
const Consent = require('./consent.dao');
const SurveyConsentType = require('./survey-consent-type.dao');
const ProfileSurvey = require('./profile-survey.dao');
const Profile = require('./profile.dao');
const Language = require('./language.dao');
const Section = require('./section.dao');
const Smtp = require('./smtp.dao');

const consentType = new ConsentType();
const consentDocument = new ConsentDocument({ consentType });
const consentSignature = new ConsentSignature();
const user = new User({ consentDocument });
const surveyConsentType = new SurveyConsentType({ user });
const section = new Section();
const questionChoice = new QuestionChoice();
const questionAction = new QuestionAction();
const question = new Question({ questionChoice, questionAction });
const answer = new Answer({ surveyConsentType });
const survey = new Survey({ answer, section, question });
const consent = new Consent({ consentDocument });
const profileSurvey = new ProfileSurvey({ survey, consentDocument, answer });
const profile = new Profile({ profileSurvey, survey, answer, user, consentSignature });
const language = new Language();
const smtp = new Smtp();

module.exports = {
    user,
    section,
    questionChoice,
    questionAction,
    question,
    answer,
    survey,
    consentType,
    consentDocument,
    consentSignature,
    consent,
    surveyConsentType,
    profileSurvey,
    profile,
    language,
    smtp
};
