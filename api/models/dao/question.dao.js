'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');
const SPromise = require('../../lib/promise');
const Translatable = require('./translatable');
const exportCSVConverter = require('../../export/csv-converter.js');

const sequelize = db.sequelize;
const SurveyQuestion = db.SurveyQuestion;
const Question = db.Question;

module.exports = class QuestionDAO extends Translatable {
    constructor(dependencies) {
        super('question_text', 'questionId', ['text', 'instruction'], { instruction: true });
        Object.assign(this, dependencies);
    }

    createActionsTx(id, actions, tx) {
        if (actions && actions.length) {
            return this.questionAction.createActionsPerQuestionTx(id, actions, tx)
                .then(() => ({ id }));
        } else {
            return SPromise.resolve({ id });
        }
    }

    createQuestionTx(question, tx) {
        const qxFields = _.omit(question, ['oneOfChoices', 'choices', 'actions', 'questions']);
        return Question.create(qxFields, { transaction: tx })
            .then(created => {
                const { text, instruction } = question;
                const id = created.id;
                return this.createTextTx({ text, instruction, id }, tx)
                    .then(() => created);
            })
            .then(created => {
                return this.createActionsTx(created.id, question.actions, tx)
                    .then(() => created);
            })
            .then((created) => {
                let { oneOfChoices, choices } = question;
                const nOneOfChoices = (oneOfChoices && oneOfChoices.length) || 0;
                const nChoices = (choices && choices.length) || 0;
                if (nOneOfChoices || nChoices) {
                    if (nOneOfChoices) {
                        choices = oneOfChoices.map(text => ({ text, type: 'bool' }));
                    }
                    return SPromise.all(choices.map((c, index) => {
                        const choice = {
                            questionId: created.id,
                            text: c.text,
                            type: c.type || 'bool',
                            line: index
                        };
                        return this.questionChoice.createQuestionChoiceTx(choice, tx)
                            .then(() => created);
                    })).then(() => created);
                }
                return created;
            })
            .then(({ id }) => id);
    }

    createQuestion(question) {
        return sequelize.transaction(tx => {
            return this.createQuestionTx(question, tx);
        });
    }

    replaceQuestion(id, replacement) {
        return SurveyQuestion.count({ where: { questionId: id } })
            .then(count => {
                if (count) {
                    return RRError.reject('qxReplaceWhenActiveSurveys');
                } else {
                    return sequelize.transaction(tx => {
                        return Question.findById(id, { transaction: tx })
                            .then(question => {
                                if (!question) {
                                    return RRError.reject('qxNotFound');
                                }
                                const version = question.version || 1;
                                const newQuestion = Object.assign({}, replacement, {
                                    version: version + 1,
                                    groupId: question.groupId || question.id
                                });
                                return this.createQuestionTx(newQuestion, tx)
                                    .then(id => {
                                        if (!question.groupId) {
                                            return question.update({ version: 1, groupId: question.id }, { transaction: tx })
                                                .then(() => id);
                                        } else {
                                            return id;
                                        }
                                    })
                                    .then(id => {
                                        return question.destroy({ transaction: tx })
                                            .then(() => SurveyQuestion.destroy({ where: { questionId: question.id } }))
                                            .then(() => ({ id }));
                                    });
                            });
                    });
                }
            });
    }

    getQuestion(id, options = {}) {
        const language = options.language;
        return Question.findById(id, { raw: true, attributes: ['id', 'type', 'meta'] })
            .then(question => {
                if (!question) {
                    return RRError.reject('qxNotFound');
                }
                if (question.meta === null) {
                    delete question.meta;
                }
                return question;
            })
            .then(question => this.updateText(question, language))
            .then(question => {
                return this.questionAction.findActionsPerQuestion(question.id, language)
                    .then(actions => {
                        if (actions.length) {
                            question.actions = actions;

                        }
                        return question;
                    });
            })
            .then(question => {
                if (['choice', 'choices'].indexOf(question.type) < 0) {
                    return question;
                }
                return this.questionChoice.findChoicesPerQuestion(question.id, options.language)
                    .then(choices => {
                        if (question.type === 'choice') {
                            question.choices = choices.map(({ id, text }) => ({
                                id,
                                text
                            }));
                        } else {
                            question.choices = choices.map(({ id, text, type }) => ({
                                id,
                                text,
                                type: type
                            }));
                        }
                        return question;
                    });
            });
    }

    _updateQuestionTextTx({ id, text, instruction }, language, tx) {
        if (text) {
            return this.createTextTx({ id, text, instruction, language }, tx);
        } else {
            return SPromise.resolve();
        }
    }

    updateQuestionTextTx(translation, language, tx) {
        return this._updateQuestionTextTx(translation, language, tx)
            .then(() => {
                const choices = translation.choices;
                if (choices) {
                    return this.questionChoice.updateMultipleChoiceTextsTx(choices, language, tx);
                }
            })
            .then(() => {
                const actions = translation.actions;
                if (actions) {
                    return this.questionAction.updateMultipleActionTextsTx(actions, language, tx);
                }
            });
    }

    updateQuestionText(translation, language) {
        return sequelize.transaction(tx => {
            return this.updateQuestionTextTx(translation, language, tx);
        });
    }

    deleteQuestion(id) {
        return SurveyQuestion.count({ where: { questionId: id } })
            .then(count => {
                if (count) {
                    return RRError.reject('qxReplaceWhenActiveSurveys');
                } else {
                    return Question.destroy({ where: { id } })
                        .then(() => {
                            return SurveyQuestion.destroy({ where: { questionId: id } });
                        });
                }
            });
    }

    listQuestions({ scope, ids, language } = {}) {
        scope = scope || 'summary';
        const attributes = ['id', 'type'];
        if (scope === 'complete') {
            attributes.push('meta');
        }
        const options = { raw: true, attributes, order: 'id' };
        if (ids) {
            options.where = { id: { $in: ids } };
        }
        return Question.findAll(options)
            .then(questions => {
                if (ids && (questions.length !== ids.length)) {
                    return RRError.reject('qxNotFound');
                }
                if (!questions.length) {
                    return questions;
                }
                const map = new Map(questions.map(question => ([question.id, question])));
                if (ids) {
                    questions = ids.map(id => map.get(id)); // order by specified ids
                }
                questions.forEach(question => {
                    if (question.meta === null) {
                        delete question.meta;
                    }
                });
                return this.updateAllTexts(questions, language)
                    .then(() => {
                        if (scope === 'complete') {
                            return this.questionAction.findActionsPerQuestions(ids, language)
                                .then(actions => {
                                    if (actions.length) {
                                        actions.forEach(action => {
                                            const q = map.get(action.questionId);
                                            if (q) {
                                                delete action.questionId;
                                                if (q.actions) {
                                                    q.actions.push(action);
                                                } else {
                                                    q.actions = [action];
                                                }
                                            }
                                        });
                                    }
                                });
                        }
                    })
                    .then(() => {
                        if (scope !== 'summary') {
                            return this.questionChoice.getAllQuestionChoices(ids, language)
                                .then(choices => {
                                    choices.forEach(choice => {
                                        const q = map.get(choice.questionId);
                                        if (q) {
                                            delete choice.questionId;
                                            if (q.type === 'choice') {
                                                delete choice.type;
                                            }
                                            if (q.choices) {
                                                q.choices.push(choice);
                                            } else {
                                                q.choices = [choice];
                                            }
                                        }
                                    });
                                });
                        }
                    })
                    .then(() => questions);
            });
    }

    export () {
        return this.listQuestions({ scope: 'export' })
            .then(questions => {
                return questions.reduce((r, { id, type, text, instruction, choices }) => {
                    const questionLine = { id, type, text, instruction };
                    if (!choices) {
                        r.push(questionLine);
                        return r;
                    }
                    choices.forEach(({ id, type, text }, index) => {
                        const line = { choiceId: id, choiceText: text };
                        if (type) {
                            line.choiceType = type;
                        }
                        if (index === 0) {
                            Object.assign(line, questionLine);
                        }
                        r.push(line);
                    });
                    return r;
                }, []);
            })
            .then(lines => {
                const converter = new exportCSVConverter();
                return converter.dataToCSV(lines);
            });
    }
};
