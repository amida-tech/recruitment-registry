'use strict';

const Sequelize = require('sequelize');

const config = require('../../config');
const logger = require('../../logger');

const dbName = process.env.RECREG_DB_NAME_OVERRIDE || config.db.name;

const sequelizeOptions = {
    host: config.db.host,
    dialect: config.db.dialect,
    dialectOptions: {
        ssl: (config.env === 'production'),
        prependSearchPath: config.db.schema !== 'public',
    },
    port: config.db.port,
    pool: {
        max: config.db.poolMax,
        min: config.db.poolMin,
        idle: config.db.poolIdle,
    },
    logging: message => logger.info(message),
    schema: config.db.schema,
    operatorsAliases: false,
};

if (config.db.schema !== 'public') {
    sequelizeOptions.searchPath = config.db.schema;
}

const sequelize = new Sequelize(dbName, config.db.user, config.db.pass, sequelizeOptions);

const SurveyStatus = sequelize.import('./survey-status.model');
const User = sequelize.import('./user.model');
const QuestionType = sequelize.import('./question-type.model');
const Question = sequelize.import('./question.model');
const ChoiceSet = sequelize.import('./choice-set.model');
const QuestionChoice = sequelize.import('./question-choice.model');
const QuestionChoiceText = sequelize.import('./question-choice-text.model');
const QuestionText = sequelize.import('./question-text.model');
const AnswerRuleLogic = sequelize.import('./answer-rule-logic.model');
const AnswerRule = sequelize.import('./answer-rule.model');
const AnswerRuleValue = sequelize.import('./answer-rule-value.model');
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
const Section = sequelize.import('./section.model');
const SectionText = sequelize.import('./section-text.model');
const SurveySection = sequelize.import('./survey-section.model');
const SurveySectionQuestion = sequelize.import('./survey-section-question.model');
const SmtpText = sequelize.import('./smtp-text.model');
const Smtp = sequelize.import('./smtp.model');
const UserSurvey = sequelize.import('./user-survey.model');
const Assessment = sequelize.import('./assessment.model');
const AssessmentSurvey = sequelize.import('./assessment-survey.model');
const UserAssessment = sequelize.import('./user-assessment.model');
const UserAssessmentAnswer = sequelize.import('./user-assessment-answer.model');
const QuestionIdentifier = sequelize.import('./question-identifier.model');
const AnswerIdentifier = sequelize.import('./answer-identifier.model');
const SurveyIdentifier = sequelize.import('./survey-identifier.model');
const StagingBhrGap = sequelize.import('./staging-bhr-gap.model');
const UserAudit = sequelize.import('./user-audit.model');
const ResearchSite = sequelize.import('./research-site.model');
const ResearchSiteVicinity = sequelize.import('./research-site-vicinity.model');

const questionBelongsToArgument = {
    as: 'question',
    foreignKey: {
        allowNull: false,
        fieldName: 'questionId',
        field: 'question_id',
        references: {
            model: 'question',
            key: 'id',
        },
    },
};

const questionChoiceBelongsToArgument = {
    as: 'questionChoice',
    foreignKey: {
        fileName: 'questionChoiceId',
        field: 'question_choice_id',
        references: {
            model: 'question_choice',
            key: 'id',
        },
    },
};

const userBelongsToArgument = {
    as: 'user',
    foreignKey: {
        fieldName: 'userId',
        field: 'user_id',
        references: {
            model: 'user',
            key: 'id',
        },
    },
};

Answer.belongsTo(Question, questionBelongsToArgument);
Answer.belongsTo(QuestionChoice, questionChoiceBelongsToArgument);
Answer.belongsTo(User, userBelongsToArgument);

QuestionIdentifier.belongsTo(Question, questionBelongsToArgument);
AnswerIdentifier.belongsTo(Question, questionBelongsToArgument);
AnswerIdentifier.belongsTo(QuestionChoice, questionChoiceBelongsToArgument);

AnswerRuleValue.belongsTo(QuestionChoice, questionChoiceBelongsToArgument);

AnswerRule.belongsTo(Question, questionBelongsToArgument);
AnswerRule.belongsTo(Question, {
    as: 'answerQuestion',
    foreignKey: {
        allowNull: false,
        fieldName: 'answerQuestionId',
        field: 'answer_question_id',
        references: {
            model: 'question',
            key: 'id',
        },
    },
});

SurveyQuestion.belongsTo(Question, questionBelongsToArgument);

UserAssessment.belongsTo(Assessment, {
    as: 'assessment',
    foreignKey: {
        allowNull: false,
        fieldName: 'assessmentId',
        field: 'assessment_id',
        references: {
            model: 'assessment',
            key: 'id',
        },
    },
});

ResearchSiteVicinity.belongsTo(ResearchSite, {
    as: 'vicinity',
    foreignKey: {
        allowNull: false,
        fieldName: 'researchSiteId',
        field: 'research_site_id',
        references: {
            model: 'research_site',
            key: 'id',
        },
    },
});

module.exports = {
    Sequelize,
    sequelize,
    SurveyStatus,
    User,
    Section,
    SectionText,
    SurveySection,
    SurveySectionQuestion,
    QuestionType,
    QuestionChoice,
    QuestionChoiceText,
    Question,
    QuestionText,
    AnswerRuleLogic,
    AnswerRule,
    AnswerRuleValue,
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
    UserSurvey,
    Assessment,
    AssessmentSurvey,
    UserAssessment,
    UserAssessmentAnswer,
    QuestionIdentifier,
    AnswerIdentifier,
    SurveyIdentifier,
    ChoiceSet,
    StagingBhrGap,
    UserAudit,
    ResearchSite,
    ResearchSiteVicinity,
};
