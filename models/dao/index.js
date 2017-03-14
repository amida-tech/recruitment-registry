'use strict';

const db = require('../db');

const UserDAO = require('./user.dao');
const AuthDAO = require('./auth.dao');
const QuestionChoiceDAO = require('./question-choice.dao');
const QuestionDAO = require('./question.dao');
const AnswerDAO = require('./answer.dao');
const SurveyDAO = require('./survey.dao');
const ConsentTypeDAO = require('./consent-type.dao');
const ConsentDocumentDAO = require('./consent-document.dao');
const ConsentSignatureDAO = require('./consent-signature.dao');
const UserConsentDocumentDAO = require('./user-consent-document.dao');
const ConsentDAO = require('./consent.dao');
const SurveyQuestionDAO = require('./survey-question.dao');
const SurveyConsentDAO = require('./survey-consent.dao');
const SurveyConsentDocumentDAO = require('./survey-consent-document.dao');
const ProfileSurveyDAO = require('./profile-survey.dao');
const ProfileDAO = require('./profile.dao');
const LanguageDAO = require('./language.dao');
const SectionDAO = require('./section.dao');
const SurveySectionQuestionDAO = require('./survey-section-question.dao');
const SurveySectionDAO = require('./survey-section.dao');
const SmtpDAO = require('./smtp.dao');
const UserSurveyDAO = require('./user-survey.dao');
const AssessmentDAO = require('./assessment.dao');
const UserAssessmentDAO = require('./user-assessment.dao');
const QuestionIdentifierDAO = require('./question-identifier.dao');
const AnswerIdentifierDAO = require('./answer-identifier.dao');
const AnswerRuleDAO = require('./answer-rule.dao');
const SurveyIdentifierDAO = require('./survey-identifier.dao');
const ChoiceSetDAO = require('./choice-set.dao');
const ResearchSiteDAO = require('./research-site.dao');

const questionIdentifier = new QuestionIdentifierDAO(db);
const answerIdentifier = new AnswerIdentifierDAO(db);
const surveyIdentifier = new SurveyIdentifierDAO(db);
const consentType = new ConsentTypeDAO(db);
const consentDocument = new ConsentDocumentDAO(db, { consentType });
const consentSignature = new ConsentSignatureDAO(db);
const userConsentDocument = new UserConsentDocumentDAO(db, { consentDocument });
const user = new UserDAO(db, { consentDocument });
const auth = new AuthDAO(db);
const surveyConsent = new SurveyConsentDAO(db, { consentType });
const surveyConsentDocument = new SurveyConsentDocumentDAO(db, { surveyConsent, userConsentDocument });
const section = new SectionDAO(db);
const surveySectionQuestion = new SurveySectionQuestionDAO(db);
const surveySection = new SurveySectionDAO(db, { section, surveySectionQuestion });
const questionChoice = new QuestionChoiceDAO(db);
const choiceSet = new ChoiceSetDAO(db, { questionChoice });
const question = new QuestionDAO(db, { questionChoice, choiceSet, questionIdentifier, answerIdentifier });
const surveyQuestion = new SurveyQuestionDAO(db);
const answerRule = new AnswerRuleDAO(db);
const answer = new AnswerDAO(db, { surveyConsentDocument, surveyQuestion, answerRule });
const survey = new SurveyDAO(db, { answer, answerRule, surveySection, question, questionChoice, surveyIdentifier, surveyQuestion });
const userSurvey = new UserSurveyDAO(db, { survey, answer });
const consent = new ConsentDAO(db, { consentDocument });
const profileSurvey = new ProfileSurveyDAO(db, { survey, consentDocument, answer });
const profile = new ProfileDAO(db, { profileSurvey, survey, answer, user, consentSignature });
const language = new LanguageDAO(db);
const smtp = new SmtpDAO(db);
const assessment = new AssessmentDAO(db);
const userAssessment = new UserAssessmentDAO(db, { answer });
const researchSite = new ResearchSiteDAO(db);

module.exports = {
    user,
    auth,
    section,
    surveySection,
    questionChoice,
    question,
    answer,
    survey,
    userSurvey,
    consentType,
    consentDocument,
    consentSignature,
    userConsentDocument,
    consent,
    surveyConsent,
    surveyConsentDocument,
    profileSurvey,
    profile,
    language,
    smtp,
    assessment,
    userAssessment,
    questionIdentifier,
    answerIdentifier,
    surveyIdentifier,
    choiceSet,
    surveyQuestion,
    answerRule,
    researchSite,
};
