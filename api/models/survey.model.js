'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

const extractNewSurveyQuestions = function (questions) {
    return questions.reduce(function (r, { content }, index) {
        if (content) {
            r.push({ content, index });
        }
        return r;
    }, []);
};

const newQuestionsPromise = function (sequelize, survey, tx) {
    const newQuestions = extractNewSurveyQuestions(survey.questions);
    if (newQuestions.length) {
        return sequelize.Promise.all(newQuestions.map(function (q) {
                return sequelize.models.question.createQuestionTx(q.content, tx).then(function (id) {
                    survey.questions[q.index] = { id };
                });
            }))
            .then(() => survey);
    } else {
        return survey;
    }
};

module.exports = function (sequelize, DataTypes) {
    const Survey = sequelize.define('survey', {
        name: {
            type: DataTypes.TEXT
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        classMethods: {
            createSurveyTx: function (survey, tx) {
                const newSurvey = {
                    name: survey.name
                };
                return Survey.create(newSurvey, { transaction: tx })
                    .then(function (result) {
                        newSurvey.id = result.id;
                        if (survey.questions && survey.questions.length) {
                            newSurvey.questions = survey.questions.slice();
                            return newQuestionsPromise(sequelize, newSurvey, tx);
                        } else {
                            return newSurvey;
                        }
                    })
                    .then((newSurvey) => {
                        const id = newSurvey.id;
                        const questions = newSurvey.questions;
                        if (questions.length) {
                            return sequelize.Promise.all(questions.map(function (question, index) {
                                return sequelize.models.survey_question.create({
                                    questionId: question.id,
                                    surveyId: id,
                                    line: index
                                }, {
                                    transaction: tx
                                });
                            })).then(function () {
                                return id;
                            });
                        } else {
                            return id;
                        }
                    });
            },
            createSurvey: function (survey) {
                return sequelize.transaction(function (tx) {
                    return Survey.createSurveyTx(survey, tx);
                });
            },
            listSurveys: function () {
                return Survey.findAll({ raw: true, attributes: ['id', 'name'], order: 'id' });
            },
            getSurvey: function (where) {
                return Survey.find({ where, raw: true, attributes: ['id', 'name'] })
                    .then(function (survey) {
                        if (!survey) {
                            return RRError.reject('surveyNotFound');
                        }
                        return sequelize.models.survey_question.findAll({
                                where: { surveyId: survey.id },
                                raw: true,
                                attributes: ['questionId']
                            })
                            .then(result => {
                                const questionIds = _.map(result, 'questionId');
                                return sequelize.models.question.getQuestions(questionIds);
                            })
                            .then(questions => {
                                survey.questions = questions;
                                return survey;
                            });
                    });
            },
            getSurveyById: function (id) {
                return Survey.getSurvey({ id });
            },
            getSurveyByName: function (name) {
                return Survey.getSurvey({ name });
            },
            getAnsweredSurvey: function (surveyPromise, userId) {
                return surveyPromise
                    .then(function (survey) {
                        return sequelize.models.answer.getAnswers({
                                userId,
                                surveyId: survey.id
                            })
                            .then(function (answers) {
                                const qmap = _.keyBy(survey.questions, 'id');
                                answers.forEach(answer => {
                                    const qid = answer.questionId;
                                    const question = qmap[qid];
                                    question.answer = answer.answer;
                                });
                                return survey;
                            });
                    });
            },
            getAnsweredSurveyById: function (userId, id) {
                const p = Survey.getSurveyById(id);
                return Survey.getAnsweredSurvey(p, userId);
            },
            getAnsweredSurveyByName: function (userId, name) {
                const p = Survey.getSurveyByName(name);
                return Survey.getAnsweredSurvey(p, userId);
            }
        }
    });

    return Survey;
};
