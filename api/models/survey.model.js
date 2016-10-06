'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const Survey = sequelize.define('survey', {
        name: {
            type: DataTypes.TEXT
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        groupId: {
            type: DataTypes.INTEGER,
            field: 'group_id'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            createNewQuestionsTx: function (questions, tx) {
                const newQuestions = questions.reduce(function (r, qx, index) {
                    if (!qx.id) {
                        r.push({ qx, index });
                    }
                    return r;
                }, []);
                if (newQuestions.length) {
                    return sequelize.Promise.all(newQuestions.map(function (q) {
                            return sequelize.models.question.createQuestionTx(q.qx, tx).then(function (id) {
                                questions[q.index] = { id };
                            });
                        }))
                        .then(() => questions);
                } else {
                    return sequelize.Promise.resolve(questions);
                }
            },
            updateQuestionsTx: function (inputQxs, surveyId, tx) {
                const questions = inputQxs.slice();
                return Survey.createNewQuestionsTx(questions, tx)
                    .then((questions) => {
                        return sequelize.Promise.all(questions.map(function ({ id: questionId }, line) {
                            return sequelize.models.survey_question.create({
                                questionId,
                                surveyId,
                                line
                            }, {
                                transaction: tx
                            });
                        }));
                    });
            },
            createSurveyTx: function (survey, tx) {
                const { name } = survey;
                if (!(survey.questions && survey.questions.length)) {
                    return RRError.reject('surveyNoQuestions');
                }
                return Survey.create({ name, version: 1 }, { transaction: tx })
                    .then((created) => {
                        // TODO: Find a way to use postgres sequences instead of update
                        return created.update({ groupId: created.id }, { transaction: tx });
                    })
                    .then(function ({ id }) {
                        return Survey.updateQuestionsTx(survey.questions, id, tx)
                            .then(() => id);
                    });
            },
            createSurvey: function (survey) {
                return sequelize.transaction(function (tx) {
                    return Survey.createSurveyTx(survey, tx);
                });
            },
            updateSurvey: function (id, { name }) {
                return Survey.findById(id)
                    .then(survey => survey.update({ name }))
                    .then(() => ({}));
            },
            replaceSurveyTx(survey, replacement, tx) {
                replacement.version = survey.version + 1;
                replacement.groupId = survey.groupId;
                const newSurvey = {
                    name: replacement.name,
                    version: survey.version + 1,
                    groupId: survey.groupId
                };
                return Survey.create(newSurvey, { transaction: tx })
                    .then(function ({ id }) {
                        return Survey.updateQuestionsTx(replacement.questions, id, tx)
                            .then(() => id);
                    })
                    .then((id) => {
                        return Survey.destroy({ where: { id: survey.id } }, { transaction: tx })
                            .then(() => id);
                    });
            },
            replaceSurvey: function ({ id, replacement }) {
                if (!_.get(replacement, 'questions.length')) {
                    return RRError.reject('surveyNoQuestions');
                }
                return Survey.findById(id)
                    .then(survey => {
                        if (!survey) {
                            return RRError.reject('surveyNotFound');
                        }
                        return survey;
                    })
                    .then(survey => {
                        return sequelize.transaction(function (tx) {
                            return Survey.replaceSurveyTx(survey, replacement, tx);
                        });
                    });
            },
            deleteSurvey: function (id) {
                return Survey.destroy({ where: { id } });
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
