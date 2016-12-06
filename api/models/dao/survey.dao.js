'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');

const Translatable = require('./translatable');

const sequelize = db.sequelize;
const Survey = db.Survey;
const SurveyQuestion = db.SurveyQuestion;
const ProfileSurvey = db.ProfileSurvey;

module.exports = class SurveyDAO extends Translatable {
    constructor(dependencies) {
        super('survey_text', 'surveyId', ['name', 'description'], { description: true });
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
        const fields = _.omit(survey, ['name', 'description', 'sections', 'questions']);
        return Survey.create(fields, { transaction: tx })
            .then(({ id }) => this.createTextTx({ id, name: survey.name, description: survey.description }, tx))
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

    updateSurveyTextTx({ id, name, description, sections }, language, tx) {
        return this.createTextTx({ id, name, description, language }, tx)
            .then(() => {
                if (sections) {
                    return this.section.updateMultipleSectionNamesTx(sections, language, tx);
                }
            });
    }

    updateSurveyText({ id, name, description, sections }, language) {
        return sequelize.transaction(tx => {
            return this.updateSurveyTextTx({ id, name, description, sections }, language, tx);
        });
    }

    updateSurvey(id, surveyUpdate) {
        return Survey.update(surveyUpdate, { where: { id } });
    }

    replaceSurveyTx(id, replacement, transaction) {
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
                return this.createSurveyTx(newSurvey, transaction)
                    .then((id) => {
                        if (!survey.version) {
                            return survey.update({ version: 1, groupId: survey.id }, { transaction })
                                .then(() => id);
                        }
                        return id;
                    })
                    .then((id) => {
                        return survey.destroy({ transaction })
                            .then(() => SurveyQuestion.destroy({ where: { surveyId: survey.id }, transaction }))
                            .then(() => ProfileSurvey.destroy({ where: { surveyId: survey.id }, transaction }))
                            .then(() => ProfileSurvey.create({ surveyId: id }, { transaction }))
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

    createOrReplaceSurvey(input) {
        const survey = _.omit(input, 'parentId');
        const parentId = input.parentId;
        if (parentId) {
            return this.replaceSurvey(parentId, survey);
        } else {
            return this.createSurvey(survey);
        }
    }

    deleteSurvey(id) {
        return sequelize.transaction(transaction => {
            return Survey.destroy({ where: { id }, transaction })
                .then(() => SurveyQuestion.destroy({ where: { surveyId: id }, transaction }))
                .then(() => ProfileSurvey.destroy({ where: { surveyId: id }, transaction }));
        });
    }

    listSurveys({ scope, language, history, where, order, groupId, version } = {}) {
        const attributes = ['id'];
        if (scope === 'version-only' || scope === 'version') {
            attributes.push('groupId');
            attributes.push('version');
        }
        const options = { raw: true, attributes, order: order || 'id', paranoid: !history };
        if (groupId || version) {
            options.where = {};
            if (groupId) {
                options.where.groupId = groupId;
            }
            if (version) {
                options.where.version = version;
            }
        }
        if (language) {
            options.language = language;
        }
        if (scope === 'version-only') {
            return Survey.findAll(options);
        }
        return Survey.findAll(options)
            .then(surveys => this.updateAllTexts(surveys, options.language))
            .then(surveys => {
                if (scope === 'export') {
                    return SurveyQuestion.findAll({
                            raw: true,
                            attributes: ['surveyId', 'questionId', 'required'],
                            order: 'line'
                        })
                        .then(surveyQuestions => {
                            return surveyQuestions.reduce((r, qx) => {
                                const p = r.get(qx.surveyId);
                                if (!p) {
                                    r.set(qx.surveyId, [{ id: qx.questionId, required: qx.required }]);
                                    return r;
                                }
                                p.push({ id: qx.questionId, required: qx.required });
                                return r;
                            }, new Map());
                        })
                        .then(map => {
                            surveys.forEach(survey => {
                                survey.questions = map.get(survey.id);
                            });
                            return surveys;
                        });

                }
                return surveys;
            });
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
                return this.updateText(survey, options.language)
                    .then(() => SurveyQuestion.findAll({
                            where: { surveyId: id },
                            raw: true,
                            attributes: ['questionId', 'required']
                        })
                        .then(surveyQuestions => {
                            const ids = _.map(surveyQuestions, 'questionId');
                            const language = options.language;
                            return this.question.listQuestions({ scope: 'complete', ids, language })
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

    getAnsweredSurvey(userId, id, options) {
        return this.getSurvey(id, options)
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
};
