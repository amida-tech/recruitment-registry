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
const QuestionAction = sequelize.import('./question-action.model');
const Question = sequelize.import('./question.model');
const SurveyQuestion = sequelize.import('./survey-question.model');
const AnswerType = sequelize.import('./answer-type.model');
const Answer = sequelize.import('./answer.model');
const Survey = sequelize.import('./survey.model');
const ConsentSectionType = sequelize.import('./consent-section-type.model');
const ConsentSection = sequelize.import('./consent-section.model');
const ConsentSectionSignature = sequelize.import('./consent-section-signature.model');
const SurveyConsentSection = sequelize.import('./survey-consent-section.model');
const Registry = sequelize.import('./registry.model');

module.exports = {
    Sequelize,
    sequelize,
    Ethnicity,
    User,
    QuestionType,
    QuestionChoice,
    QuestionAction,
    Question,
    SurveyQuestion,
    AnswerType,
    Answer,
    Survey,
    ConsentSectionType,
    ConsentSection,
    ConsentSectionSignature,
    SurveyConsentSection,
    Registry
};
