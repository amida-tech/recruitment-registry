'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const textTableMethods = require('./text-table-methods');

const sequelize = db.sequelize;
const Survey = db.Survey;
const SurveyQuestion = db.SurveyQuestion;
const Registry = db.Registry;
const SurveyText = db.SurveyText;

const textHandler = textTableMethods(sequelize, 'survey_text', 'surveyId', ['name']);

module.exports = class {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createNewQuestionsTx(questions, tx) {
        const newQuestions = questions.reduce((r, qx, index) => {
            if (!qx.id) {
                r.push({ qx, index });
            }
            return r;
        }, []);
        if (newQuestions.length) {
            return SPromise.all(newQuestions.map(q => {
                    return this.question.createQuestionTx(q.qx, tx).then(id => {
                        const oldQx = questions[q.index];
                        questions[q.index] = { id, required: oldQx.required };
                    });
                }))
                .then(() => questions);
        } else {
            return SPromise.resolve(questions);
        }
    }

    updateQuestionsTx(inputQxs, surveyId, tx) {
        const questions = inputQxs.slice();
        return this.createNewQuestionsTx(questions, tx)
            .then((questions) => {
                return SPromise.all(questions.map((qx, line) => {
                    return SurveyQuestion.create({
                        questionId: qx.id,
                        surveyId,
                        line,
                        required: Boolean(qx.required)
                    }, {
                        transaction: tx
                    });
                }));
            });
    }

    createSurveyTx(survey, tx) {
        if (!(survey.questions && survey.questions.length)) {
            return RRError.reject('surveyNoQuestions');
        }
        const fields = _.omit(survey, ['name', 'sections', 'questions']);
        return Survey.create(fields, { transaction: tx })
            .then(({ id }) => textHandler.createTextTx({ id, name: survey.name }, tx))
            .then(({ id }) => {
                return this.updateQuestionsTx(survey.questions, id, tx)
                    .then(() => id);
            })
            .then(id => {
                if (survey.sections) {
                    return this.section.bulkCreateSectionsForSurveyTx(id, survey.sections, tx)
                        .then(() => id);
                } else {
                    return id;
                }
            });
    }

    createSurvey(survey) {
        return sequelize.transaction(tx => {
            return this.createSurveyTx(survey, tx);
        });
    }

    replaceSurveySections(id, sections) {
        return sequelize.transaction(tx => {
            return this.section.bulkCreateSectionsForSurveyTx(id, sections, tx);
        });
    }

    updateSurveyTextTx({ id, name, sections }, language, tx) {
        return textHandler.createTextTx({ id, name, language }, tx)
            .then(() => {
                if (sections) {
                    return this.section.updateMultipleSectionNamesTx(sections, language, tx);
                }
            });
    }

    updateSurveyText({ id, name, sections }, language) {
        return sequelize.transaction(tx => {
            return this.updateSurveyTextTx({ id, name, sections }, language, tx);
        });
    }

    updateSurvey(id, surveyUpdate) {
        return Survey.update(surveyUpdate, { where: { id } });
    }

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
                return this.createSurveyTx(newSurvey, tx)
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
                        return SurveyQuestion.destroy({ where: { surveyId: survey.id }, transaction: tx })
                            .then(() => id);
                    })
                    .then((id) => {
                        return Registry.update({ profileSurveyId: id }, { where: { profileSurveyId: survey.id }, transaction: tx })
                            .then(() => id);
                    });
            });
    }

    replaceSurvey(id, replacement) {
        if (!_.get(replacement, 'questions.length')) {
            return RRError.reject('surveyNoQuestions');
        }
        return sequelize.transaction(tx => {
            return this.replaceSurveyTx(id, replacement, tx);
        });
    }

    deleteSurvey(id) {
        return sequelize.transaction(tx => {
            return Survey.destroy({ where: { id }, transaction: tx })
                .then(() => {
                    return SurveyQuestion.destroy({ where: { surveyId: id }, transaction: tx })
                        .then(() => id);
                });
        });
    }

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
    }

    getSurvey(id, options = {}) {
        let _options = { where: { id }, raw: true, attributes: ['id', 'meta'] };
        if (options.override) {
            _options = _.assign({}, _options, options.override);
        }
        return Survey.findOne(_options)
            .then(survey => {
                if (!survey) {
                    return RRError.reject('surveyNotFound');
                }
                if (survey.meta === null) {
                    delete survey.meta;
                }
                return textHandler.updateText(survey, options.language)
                    .then(() => SurveyQuestion.findAll({
                            where: { surveyId: id },
                            raw: true,
                            attributes: ['questionId', 'required']
                        })
                        .then(surveyQuestions => {
                            const questionIds = _.map(surveyQuestions, 'questionId');
                            return this.question.listQuestions({ ids: questionIds, language: options.language })
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
                        return this.section.getSectionsForSurveyTx(survey.id, options.language)
                            .then((sections) => {
                                if (sections && sections.length) {
                                    survey.sections = sections;
                                }
                                return survey;
                            });
                    });
            });
    }

    getSurveyByName(name, options) {
        return SurveyText.findOne({
                where: { name },
                raw: true,
                attributes: ['surveyId']
            })
            .then(result => {
                if (result) {
                    return this.getSurvey(result.surveyId, options);
                } else {
                    return RRError.reject('surveyNotFound');
                }
            });
    }

    _getAnsweredSurvey(surveyPromise, userId) {
        return surveyPromise
            .then(survey => {
                return this.answer.getAnswers({
                        userId,
                        surveyId: survey.id
                    })
                    .then(answers => {
                        const qmap = _.keyBy(survey.questions, 'id');
                        answers.forEach(answer => {
                            const qid = answer.questionId;
                            const question = qmap[qid];
                            question.language = answer.language;
                            question.answer = answer.answer;
                        });
                        return survey;
                    });
            });
    }

    getAnsweredSurvey(userId, id, options) {
        const p = this.getSurvey(id, options);
        return this._getAnsweredSurvey(p, userId);
    }

    getAnsweredSurveyByName(userId, name, options) {
        const p = this.getSurveyByName(name, options);
        return this._getAnsweredSurvey(p, userId);
    }
};
