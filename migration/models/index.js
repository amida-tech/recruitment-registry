'use strict';

const Sequelize = require('sequelize');

const config = require('../../config');
const logger = require('../../logger');

const dbName = process.env.RECREG_DB_NAME_OVERRIDE || config.db.name;

const sequelize = new Sequelize(dbName, config.db.user, config.db.pass, {
    host: config.db.host,
    dialect: config.db.dialect,
    dialectOptions: {
        ssl: process.env.RECREG_DB_SSL || false
    },
    port: config.db.port,
    pool: {
        max: 20,
        min: 0,
        idle: 10000
    },
    logging: message => logger.info(message)
});

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
const ProfileSurvey = sequelize.import('./profile-survey.model');
const SurveyText = sequelize.import('./survey-text.model');
const ConsentType = sequelize.import('./consent-type.model');
const ConsentTypeText = sequelize.import('./consent-type-text.model');
const ConsentDocument = sequelize.import('./consent-document.model');
const ConsentDocumentText = sequelize.import('./consent-document-text.model');
const ConsentSignature = sequelize.import('./consent-signature.model');
const ConsentSection = sequelize.import('./consent-section.model');
const Consent = sequelize.import('./consent.model');
const SurveyConsent = sequelize.import('./survey-consent.model');
const Language = sequelize.import('./language.model');
const SurveySection = sequelize.import('./survey-section.model');
const SectionText = sequelize.import('./section-text.model');
const Section = sequelize.import('./section.model');
const SmtpText = sequelize.import('./smtp-text.model');
const Smtp = sequelize.import('./smtp.model');
const UserSurvey = sequelize.import('./user-survey.model');

Answer.belongsTo(Question, {
    as: 'question',
    foreignKey: {
        allowNull: false,
        fieldName: 'questionId',
        field: 'question_id',
        references: {
            model: 'question',
            key: 'id'
        }
    }
});

module.exports = {
    Sequelize,
    sequelize,
    User,
    Section,
    SurveySection,
    SectionText,
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
    ProfileSurvey,
    ConsentType,
    ConsentTypeText,
    ConsentDocument,
    ConsentDocumentText,
    ConsentSignature,
    ConsentSection,
    Consent,
    SurveyConsent,
    Language,
    SmtpText,
    Smtp,
    UserSurvey
};
