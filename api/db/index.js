'use strict';

const Sequelize = require('sequelize');

const config = require('../config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
    host: config.db.host,
    dialect: config.db.dialect,
    port: config.db.port,
    pool: {
        max: 20,
        min: 0,
        idle: 10000
    }
});

const Ethnicity = sequelize.import('../api/user/ethnicity.model');
const User = sequelize.import('../api/user/user.model');
const QuestionType = sequelize.import('../api/question/question-type.model');
const QuestionChoices = sequelize.import('../api/question/question-choices.model');
const Question = sequelize.import('../api/question/question.model');
const SurveyQuestion = sequelize.import('../api/survey/survey-question.model');
const Answer = sequelize.import('../api/answer/answer.model');
const Survey = sequelize.import('../api/survey/survey.model');

module.exports =  {
    Sequelize,
    sequelize,
    Ethnicity,
    User,
    QuestionType,
    QuestionChoices,
    Question,
    SurveyQuestion,
    Answer,
    Survey
};
