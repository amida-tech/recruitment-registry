'use strict';

const Sequelize = require('sequelize');
const pg = require('pg');

const config = require('../../config');
const logger = require('../../logger');

const surveyStatus = require('./survey-status.model');
const user = require('./user.model');
const questionType = require('./question-type.model');
const question = require('./question.model');
const choiceSet = require('./choice-set.model');
const questionChoice = require('./question-choice.model');
const questionChoiceText = require('./question-choice-text.model');
const questionText = require('./question-text.model');
const answerRuleLogic = require('./answer-rule-logic.model');
const answerRule = require('./answer-rule.model');
const answerRuleValue = require('./answer-rule-value.model');
const surveyQuestion = require('./survey-question.model');
const answerType = require('./answer-type.model');
const answer = require('./answer.model');
const survey = require('./survey.model');
const profileSurvey = require('./profile-survey.model');
const surveyText = require('./survey-text.model');
const consentType = require('./consent-type.model');
const consentTypeText = require('./consent-type-text.model');
const consentDocument = require('./consent-document.model');
const consentDocumentText = require('./consent-document-text.model');
const consentSignature = require('./consent-signature.model');
const consentSection = require('./consent-section.model');
const consent = require('./consent.model');
const surveyConsent = require('./survey-consent.model');
const language = require('./language.model');
const section = require('./section.model');
const sectionText = require('./section-text.model');
const surveySection = require('./survey-section.model');
const surveySectionQuestion = require('./survey-section-question.model');
const smtpText = require('./smtp-text.model');
const smtp = require('./smtp.model');
const userSurvey = require('./user-survey.model');
const assessment = require('./assessment.model');
const assessmentSurvey = require('./assessment-survey.model');
const userAssessment = require('./user-assessment.model');
const userAssessmentAnswer = require('./user-assessment-answer.model');
const questionIdentifier = require('./question-identifier.model');
const answerIdentifier = require('./answer-identifier.model');
const surveyIdentifier = require('./survey-identifier.model');
const stagingBhrGap = require('./staging-bhr-gap.model');
const userAudit = require('./user-audit.model');
const researchSite = require('./research-site.model');
const researchSiteVicinity = require('./research-site-vicinity.model');

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
};

if (config.db.schema !== 'public') {
    sequelizeOptions.searchPath = config.db.schema;
}

pg.types.setTypeParser(1184, value => value);

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, sequelizeOptions);

const SurveyStatus = surveyStatus(sequelize, Sequelize);
const User = user(sequelize, Sequelize);
const QuestionType = questionType(sequelize, Sequelize);
const Question = question(sequelize, Sequelize);
const ChoiceSet = choiceSet(sequelize, Sequelize);
const QuestionChoice = questionChoice(sequelize, Sequelize);
const QuestionChoiceText = questionChoiceText(sequelize, Sequelize);
const QuestionText = questionText(sequelize, Sequelize);
const AnswerRuleLogic = answerRuleLogic(sequelize, Sequelize);
const AnswerRule = answerRule(sequelize, Sequelize);
const AnswerRuleValue = answerRuleValue(sequelize, Sequelize);
const SurveyQuestion = surveyQuestion(sequelize, Sequelize);
const AnswerType = answerType(sequelize, Sequelize);
const Answer = answer(sequelize, Sequelize);
const Survey = survey(sequelize, Sequelize);
const ProfileSurvey = profileSurvey(sequelize, Sequelize);
const SurveyText = surveyText(sequelize, Sequelize);
const ConsentType = consentType(sequelize, Sequelize);
const ConsentTypeText = consentTypeText(sequelize, Sequelize);
const ConsentDocument = consentDocument(sequelize, Sequelize);
const ConsentDocumentText = consentDocumentText(sequelize, Sequelize);
const ConsentSignature = consentSignature(sequelize, Sequelize);
const ConsentSection = consentSection(sequelize, Sequelize);
const Consent = consent(sequelize, Sequelize);
const SurveyConsent = surveyConsent(sequelize, Sequelize);
const Language = language(sequelize, Sequelize);
const Section = section(sequelize, Sequelize);
const SectionText = sectionText(sequelize, Sequelize);
const SurveySection = surveySection(sequelize, Sequelize);
const SurveySectionQuestion = surveySectionQuestion(sequelize, Sequelize);
const SmtpText = smtpText(sequelize, Sequelize);
const Smtp = smtp(sequelize, Sequelize);
const UserSurvey = userSurvey(sequelize, Sequelize);
const Assessment = assessment(sequelize, Sequelize);
const AssessmentSurvey = assessmentSurvey(sequelize, Sequelize);
const UserAssessment = userAssessment(sequelize, Sequelize);
const UserAssessmentAnswer = userAssessmentAnswer(sequelize, Sequelize);
const QuestionIdentifier = questionIdentifier(sequelize, Sequelize);
const AnswerIdentifier = answerIdentifier(sequelize, Sequelize);
const SurveyIdentifier = surveyIdentifier(sequelize, Sequelize);
const StagingBhrGap = stagingBhrGap(sequelize, Sequelize);
const UserAudit = userAudit(sequelize, Sequelize);
const ResearchSite = researchSite(sequelize, Sequelize);
const ResearchSiteVicinity = researchSiteVicinity(sequelize, Sequelize);

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

SurveySection.belongsTo(Section, {
    as: 'section',
    onUpdate: 'NO ACTION',
    foreignKey: {
        allowNull: false,
        field: 'section_id',
        references: {
            model: 'section',
            key: 'id',
        },
    },
});

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
