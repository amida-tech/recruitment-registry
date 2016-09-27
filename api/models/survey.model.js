'use strict';

const _ = require('lodash');

const extractNewSurveyQuestions = function (survey) {
    const questions = survey.questions;
    if (questions && questions.length) {
        return questions.reduce(function (r, question, index) {
            if (question.content) {
                r.push({
                    content: question.content,
                    index
                });
            }
            return r;
        }, []);
    } else {
        return [];
    }
};

const newQuestionsPromise = function (sequelize, survey, tx) {
    const newQuestions = extractNewSurveyQuestions(survey);
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
            getSurvey: function (query, replacements) {
                return sequelize.query(query, {
                    replacements,
                    type: sequelize.QueryTypes.SELECT
                }).then(function (surveys) {
                    const survey = surveys[0];
                    if (!survey) {
                        const err = new Error('No such survey');
                        return sequelize.Promise.reject(err);
                    }
                    return survey;
                }).then(function (survey) {
                    return sequelize.query('select question_id from survey_question where survey_id = :id', {
                            replacements: {
                                id: survey.id
                            },
                            type: sequelize.QueryTypes.SELECT
                        })
                        .then(function (result) {
                            const questionIds = _.map(result, 'question_id');
                            return sequelize.models.question.getQuestions(questionIds);
                        })
                        .then(function (questions) {
                            survey.questions = questions;
                            return survey;
                        });
                });
            },
            getSurveyById: function (id) {
                const query = 'select id, name from survey where id = :id';
                return Survey.getSurvey(query, { id });
            },
            getSurveyByName: function (name) {
                const query = 'select id, name from survey where name = :name';
                return Survey.getSurvey(query, { name });
            },
            getAnsweredSurvey: function (surveyPromise, userId) {
                return surveyPromise.then(function (survey) {
                    return sequelize.models.answer.getAnswers({
                            userId,
                            surveyId: survey.id
                        })
                        .then(function (answers) {
                            const qmap = _.keyBy(survey.questions, 'id');
                            answers.forEach(function (answer) {
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
