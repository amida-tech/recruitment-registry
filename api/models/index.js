'use strict';

const Sequelize = require('sequelize');

const config = require('../config');
const logger = require('../logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
    host: config.db.host,
    dialect: config.db.dialect,
    port: config.db.port,
    pool: {
        max: 20,
        min: 0,
        idle: 10000
    },
    logging: message => logger.info(message)
});

const Ethnicity = sequelize.import('./ethnicity.model');
const User = sequelize.import('./user.model');
const QuestionType = sequelize.import('./question-type.model');
const QuestionChoice = sequelize.import('./question-choice.model');
const QuestionChoiceText = sequelize.import('./question-choice-text.model');
const QuestionAction = sequelize.import('./question-action.model');
const QuestionActionText = sequelize.import('./question-action-text.model');
const QuestionText = sequelize.import('./question-text.model');
const Question = sequelize.import('./question.model');
const SurveyQuestion = sequelize.import('./survey-question.model');
const AnswerType = sequelize.import('./answer-type.model');
const Answer = sequelize.import('./answer.model');
const Survey = sequelize.import('./survey.model');
const SurveyText = sequelize.import('./survey-text.model');
const ConsentType = sequelize.import('./consent-type.model');
const ConsentDocument = sequelize.import('./consent-document.model');
const ConsentSignature = sequelize.import('./consent-signature.model');
const ConsentSection = sequelize.import('./consent-section.model');
const Consent = sequelize.import('./consent.model');
const SurveyConsentType = sequelize.import('./survey-consent-type.model');
const Registry = sequelize.import('./registry.model');
const Language = sequelize.import('./language.model');

module.exports = {
    Sequelize,
    sequelize,
    Ethnicity,
    User,
    QuestionType,
    QuestionChoice,
    QuestionChoiceText,
    QuestionAction,
    QuestionActionText,
    Question,
    QuestionText,
    SurveyQuestion,
    AnswerType,
    Answer,
    Survey,
    SurveyText,
    ConsentType,
    ConsentDocument,
    ConsentSignature,
    ConsentSection,
    Consent,
    SurveyConsentType,
    Registry,
    Language
};
