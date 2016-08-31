'use strict';

const _ = require('lodash');

const extractNewSurveyQuestions = function(survey) {
    var questions = survey.questions;
    if (questions && questions.length) {
        return questions.reduce(function(r, question, index) {
            if (typeof question === 'object') {
                r.push({
                    question,
                    index
                });
            }
            return r;
        }, []);
    } else {
        return [];
    }
};

const newQuestionsPromise = function(sequelize, survey, transaction) {
    const newQuestions = extractNewSurveyQuestions(survey);
    if (newQuestions.length) {
        return sequelize.Promise.all(newQuestions.map(function(q) {
            return sequelize.models.question.post(q.question, transaction).then(function(id) {
                survey.questions[q.index] = id;
            });
        })).then(function() {
            return survey;
        });
    } else {
        return survey;
    }
};

module.exports = function (sequelize, DataTypes) {
    const Survey = sequelize.define('survey', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
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
            post: function(survey) {
                var newSurvey = {
                    name: survey.name
                };
                return sequelize.transaction(function (t) {
                    return Survey.create(newSurvey, {
                        transaction: t
                    }).then(function(result) {
                        newSurvey.id = result.id;
                        if (survey.questions && survey.questions.length) {
                            newSurvey.questions = survey.questions.slice();
                            return newQuestionsPromise(sequelize, newSurvey, t);
                        } else {
                            return newSurvey;
                        }
                    })
                    .then((newSurvey) => {
                        var id = newSurvey.id;
                        var questions = newSurvey.questions;
                        if (questions.length) {
                            return sequelize.Promise.all(questions.map(function(question, index) {
                                return sequelize.models.survey_question.create({
                                    questionId: question,
                                    surveyId: id,
                                    line: index
                                }, {
                                    transaction: t
                                });
                            })).then(function() {
                                return id;
                            });
                        } else {
                            return id;
                        }
                    });
                });
            },
            get: function(id) {
                return sequelize.query('select id, name from survey where id = :id', {
                    replacements: {id},
                    type: sequelize.QueryTypes.SELECT
                }).then(function(surveys) {
                    const survey = surveys[0];
                    if (! survey) {
                        return sequelize.Promise.reject('No such survey');
                    }
                    return survey;
                }).then(function(survey) {
                    return sequelize.query('select question_id from survey_question where survey_id = :id', {
                        replacements: {id},
                        type: sequelize.QueryTypes.SELECT
                    }).then(function(result) {
                        const questionIds = _.map(result, 'question_id');
                        return sequelize.models.question.getMultiple(questionIds);
                    }).then(function(questions) {
                        survey.questions = questions;
                        return survey;
                    });
                });
            }
        }
    });

    return Survey;
};
