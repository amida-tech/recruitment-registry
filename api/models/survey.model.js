'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'survey_text', 'surveyId', ['name']);

    const Survey = sequelize.define('survey', {
        version: {
            type: DataTypes.INTEGER
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
            createNewQuestionsTx(questions, tx) {
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
            updateQuestionsTx(inputQxs, surveyId, tx) {
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
            createSurveyTx(survey, tx) {
                if (!(survey.questions && survey.questions.length)) {
                    return RRError.reject('surveyNoQuestions');
                }
                const fields = _.omit(survey, ['name', 'sections', 'questions']);
                return Survey.create(fields, { transaction: tx })
                    .then(({ id }) => textHandler.createTextTx({ id, name: survey.name }, tx))
                    .then(({ id }) => {
                        return Survey.updateQuestionsTx(survey.questions, id, tx)
                            .then(() => id);
                    })
                    .then(id => {
                        if (survey.sections) {
                            return sequelize.models.rr_section.bulkCreateSectionsForSurveyTx(id, survey.sections, tx)
                                .then(() => id);
                        } else {
                            return id;
                        }
                    });
            },
            createSurvey(survey) {
                return sequelize.transaction(function (tx) {
                    return Survey.createSurveyTx(survey, tx);
                });
            },
            replaceSurveySections(id, sections) {
                return sequelize.transaction(function (tx) {
                    return sequelize.models.rr_section.bulkCreateSectionsForSurveyTx(id, sections, tx);
                });
            },
            updateSurveyText({ id, name, sections }, language) {
                return sequelize.transaction(function (tx) {
                    return textHandler.createTextTx({ id, name, language }, tx)
                        .then(() => {
                            if (sections) {
                                return sequelize.models.rr_section.updateMultipleSectionNamesTx(sections, language, tx);
                            }
                        });
                });
            },
            replaceSurveyTx(id, replacement, tx) {
                return Survey.findById(id)
                    .then(survey => {
                        if (!survey) {
                            return RRError.reject('surveyNotFound');
                        }
                        return survey;
                    })
                    .then(survey => {
                        const version = survey.version || 1;
                        const newSurvey = Object.assign({
                            version: version + 1,
                            groupId: survey.groupId || survey.id
                        }, replacement);
                        return Survey.createSurveyTx(newSurvey, tx)
                            .then((id) => {
                                if (!survey.version) {
                                    return survey.update({ version: 1, groupId: survey.id }, { transaction: tx })
                                        .then(() => id);
                                }
                                return id;
                            })
                            .then((id) => {
                                return survey.destroy({ transaction: tx })
                                    .then(() => id);
                            })
                            .then((id) => {
                                return sequelize.models.survey_question.destroy({ where: { surveyId: survey.id }, transaction: tx })
                                    .then(() => id);
                            })
                            .then((id) => {
                                return sequelize.models.registry.update({ profileSurveyId: id }, { where: { profileSurveyId: survey.id }, transaction: tx })
                                    .then(() => id);
                            });
                    });
            },
            replaceSurvey(id, replacement) {
                if (!_.get(replacement, 'questions.length')) {
                    return RRError.reject('surveyNoQuestions');
                }
                return sequelize.transaction(function (tx) {
                    return Survey.replaceSurveyTx(id, replacement, tx);
                });
            },
            deleteSurvey(id) {
                return sequelize.transaction(function (tx) {
                    return Survey.destroy({ where: { id }, transaction: tx })
                        .then(() => {
                            return sequelize.models.survey_question.destroy({ where: { surveyId: id }, transaction: tx })
                                .then(() => id);
                        });
                });
            },
            listSurveys(options = {}) {
                let _options = {
                    raw: true,
                    attributes: ['id'],
                    order: 'id'
                };
                if (options.override) {
                    _options = _.assign({}, _options, options.override);
                    const indexName = _options.attributes.indexOf('name');
                    if (indexName < 0) {
                        return Survey.findAll(_options);
                    } else {
                        _options.attributes.splice(indexName, 1);
                    }
                }
                return Survey.findAll(_options)
                    .then(surveys => textHandler.updateAllTexts(surveys, options.language));
            },
            getSurvey(id, options = {}) {
                let _options = { where: { id }, raw: true, attributes: ['id'] };
                if (options.override) {
                    _options = _.assign({}, _options, options.override);
                }
                return Survey.findOne(_options)
                    .then(function (survey) {
                        if (!survey) {
                            return RRError.reject('surveyNotFound');
                        }
                        return textHandler.updateText(survey, options.language)
                            .then(() => sequelize.models.survey_question.findAll({
                                    where: { surveyId: id },
                                    raw: true,
                                    attributes: ['questionId', 'required']
                                })
                                .then(surveyQuestions => {
                                    const questionIds = _.map(surveyQuestions, 'questionId');
                                    return sequelize.models.question.listQuestions({ ids: questionIds })
                                        .then(questions => ({ questions, surveyQuestions }));
                                })
                                .then(({ questions, surveyQuestions }) => {
                                    const qxMap = _.keyBy(questions, 'id');
                                    const fn = qx => Object.assign(qxMap[qx.questionId], { required: qx.required });
                                    const qxs = surveyQuestions.map(fn);
                                    survey.questions = qxs;
                                    return survey;
                                })
                            ).then(() => {
                                return sequelize.models.rr_section.getSectionsForSurveyTx(survey.id, options.language)
                                    .then((sections) => {
                                        if (sections && sections.length) {
                                            survey.sections = sections;
                                        }
                                        return survey;
                                    });
                            });
                    });
            },
            getSurveyByName(name, options) {
                return sequelize.models.survey_text.findOne({
                        where: { name },
                        raw: true,
                        attributes: ['surveyId']
                    })
                    .then(result => {
                        if (result) {
                            return Survey.getSurvey(result.surveyId, options);
                        } else {
                            return RRError.reject('surveyNotFound');
                        }
                    });
            },
            _getAnsweredSurvey(surveyPromise, userId) {
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
            getAnsweredSurvey(userId, id, options) {
                const p = Survey.getSurvey(id, options);
                return Survey._getAnsweredSurvey(p, userId);
            },
            getAnsweredSurveyByName(userId, name, options) {
                const p = Survey.getSurveyByName(name, options);
                return Survey._getAnsweredSurvey(p, userId);
            }
        }
    });

    return Survey;
};
