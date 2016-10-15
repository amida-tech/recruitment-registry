'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'survey_text', 'surveyId', ['name']);

    const Survey = sequelize.define('survey', {
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
                                const oldQx = questions[q.index];
                                questions[q.index] = { id, required: oldQx.required };
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
                        return sequelize.Promise.all(questions.map((qx, line) => {
                            return sequelize.models.survey_question.create({
                                questionId: qx.id,
                                surveyId,
                                line,
                                required: Boolean(qx.required)
                            }, {
                                transaction: tx
                            });
                        }));
                    });
            },
            createSurveyTx: function (survey, tx) {
                if (!(survey.questions && survey.questions.length)) {
                    return RRError.reject('surveyNoQuestions');
                }
                return Survey.create({ version: 1 }, { transaction: tx })
                    .then(created => {
                        // TODO: Find a way to use postgres sequences instead of update
                        return created.update({ groupId: created.id }, { transaction: tx });
                    })
                    .then(({ id }) => textHandler.createTextTx({ id, name: survey.name }, tx))
                    .then(({ id }) => {
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
                return textHandler.createText({ id, name })
                    .then(() => ({}));
            },
            replaceSurveyTx(survey, replacement, tx) {
                replacement.version = survey.version + 1;
                replacement.groupId = survey.groupId;
                const newSurvey = {
                    version: survey.version + 1,
                    groupId: survey.groupId
                };
                return Survey.create(newSurvey, { transaction: tx })
                    .then(({ id }) => textHandler.createTextTx({
                        id,
                        name: replacement.name
                    }, tx))
                    .then(({ id }) => {
                        return Survey.updateQuestionsTx(replacement.questions, id, tx)
                            .then(() => id);
                    })
                    .then((id) => {
                        return Survey.destroy({ where: { id: survey.id } }, { transaction: tx })
                            .then(() => id);
                    })
                    .then((id) => {
                        return sequelize.models.survey_question.destroy({ where: { surveyId: id } }, { transaction: tx })
                            .then(() => id);
                    })
                    .then((id) => {
                        return sequelize.models.registry.update({ profileSurveyId: id }, { where: { profileSurveyId: survey.id }, transaction: tx })
                            .then(() => id);
                    });
            },
            replaceSurvey: function (id, replacement, tx) {
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
                        if (tx) {
                            return Survey.replaceSurveyTx(survey, replacement, tx);
                        } else {
                            return sequelize.transaction(function (tx) {
                                return Survey.replaceSurveyTx(survey, replacement, tx);
                            });
                        }
                    });
            },
            deleteSurvey: function (id) {
                return sequelize.transaction(function (tx) {
                    return Survey.destroy({ where: { id } }, { transaction: tx })
                        .then(() => {
                            return sequelize.models.survey_question.destroy({ where: { surveyId: id } }, { transaction: tx })
                                .then(() => id);
                        });
                });
            },
            listSurveys: function () {
                return Survey.findAll({ raw: true, attributes: ['id'], order: 'id' })
                    .then(surveys => textHandler.updateAllTexts(surveys));
            },
            getSurvey: function (where) {
                return Survey.find({ where, raw: true, attributes: ['id'] })
                    .then(function (survey) {
                        if (!survey) {
                            return RRError.reject('surveyNotFound');
                        }
                        return textHandler.updateText(survey)
                            .then(() => {
                                return sequelize.models.survey_question.findAll({
                                        where: { surveyId: survey.id },
                                        raw: true,
                                        attributes: ['questionId', 'required']
                                    })
                                    .then(surveyQuestions => {
                                        const questionIds = _.map(surveyQuestions, 'questionId');
                                        return sequelize.models.question.getQuestions(questionIds)
                                            .then(questions => ({ questions, surveyQuestions }));
                                    })
                                    .then(({ questions, surveyQuestions }) => {
                                        const qxMap = _.keyBy(questions, 'id');
                                        const fn = qx => Object.assign(qxMap[qx.questionId], { required: qx.required });
                                        const qxs = surveyQuestions.map(fn);
                                        survey.questions = qxs;
                                        return survey;
                                    });
                            });
                    });
            },
            getSurveyById: function (id) {
                return Survey.getSurvey({ id });
            },
            getSurveyByName: function (name) {
                return sequelize.models.survey_text.findOne({
                        where: { name },
                        raw: true,
                        attributes: ['surveyId']
                    })
                    .then(result => {
                        if (result) {
                            return Survey.getSurvey({ id: result.surveyId });
                        } else {
                            return RRError.reject('surveyNotFound');
                        }
                    });
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
