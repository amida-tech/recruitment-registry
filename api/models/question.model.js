'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');
const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'question_text', 'questionId');

    const Question = sequelize.define('question', {
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'question_type',
                key: 'name'
            },
        },
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
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            createActionsTx(id, actions, tx) {
                if (actions && actions.length) {
                    return sequelize.models.question_action.createActionsPerQuestionTx(id, actions, tx)
                        .then(() => ({ id }));
                } else {
                    return sequelize.Promise.resolve({ id });
                }
            },
            createQuestionTx(question, tx) {
                const qxFields = _.omit(question, ['oneOfChoices', 'choices', 'actions', 'questions']);
                return Question.create(qxFields, { transaction: tx })
                    .then(created => {
                        const text = question.text;
                        const id = created.id;
                        return textHandler.createTextTx({ text, id }, tx)
                            .then(() => created);
                    })
                    .then(created => {
                        return Question.createActionsTx(created.id, question.actions, tx)
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
                            return sequelize.Promise.all(choices.map((c, index) => {
                                const choice = {
                                    questionId: created.id,
                                    text: c.text,
                                    type: c.type || 'bool',
                                    line: index
                                };
                                return sequelize.models.question_choice.createQuestionChoiceTx(choice, tx)
                                    .then(() => created);
                            })).then(() => created);
                        }
                        return created;
                    })
                    .then(({ id }) => id);
            },
            createQuestion(question) {
                return sequelize.transaction(tx => {
                    return Question.createQuestionTx(question, tx);
                });
            },
            replaceQuestion(id, replacement) {
                return sequelize.models.survey_question.count({ where: { questionId: id } })
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
                                        return Question.createQuestionTx(newQuestion, tx)
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
                                                    .then(() => sequelize.models.survey_question.destroy({ where: { questionId: question.id } }))
                                                    .then(() => ({ id }));
                                            });
                                    });
                            });
                        }
                    });
            },
            getQuestion(id, options = {}) {
                const language = options.language;
                return Question.findById(id, { raw: true, attributes: ['id', 'type'] })
                    .then(question => {
                        if (!question) {
                            return RRError.reject('qxNotFound');
                        }
                        return question;
                    })
                    .then(question => textHandler.updateText(question, language))
                    .then(question => {
                        return sequelize.models.question_action.findActionsPerQuestion(question.id, language)
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
                        return sequelize.models.question_choice.findChoicesPerQuestion(question.id, options.language)
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
            },
            _updateQuestionTextTx({ id, text }, language, tx) {
                if (text) {
                    return textHandler.createTextTx({ id, text, language }, tx);
                } else {
                    return sequelize.Promise.resolve();
                }
            },
            updateQuestionTextTx(translation, language, tx) {
                return Question._updateQuestionTextTx(translation, language, tx)
                    .then(() => {
                        const choices = translation.choices;
                        if (choices) {
                            return sequelize.models.question_choice.updateMultipleChoiceTextsTx(choices, language, tx);
                        }
                    })
                    .then(() => {
                        const actions = translation.actions;
                        if (actions) {
                            return sequelize.models.question_action.updateMultipleActionTextsTx(actions, language, tx);
                        }
                    });
            },
            updateQuestionText(translation, language) {
                return sequelize.transaction(tx => {
                    return Question.updateQuestionTextTx(translation, language, tx);
                });
            },
            deleteQuestion(id) {
                return sequelize.models.survey_question.count({ where: { questionId: id } })
                    .then(count => {
                        if (count) {
                            return RRError.reject('qxReplaceWhenActiveSurveys');
                        } else {
                            return Question.destroy({ where: { id } })
                                .then(() => {
                                    return sequelize.models.survey_question.destroy({ where: { questionId: id } });
                                });
                        }
                    });
            },
            _listQuestions(options = {}) {
                const _options = {
                    raw: true,
                    attributes: ['id', 'type'],
                    order: 'id'
                };
                const ids = options.ids;
                const language = options.language;
                if (ids) {
                    _options.where = { id: { $in: ids } };
                }
                return Question.findAll(_options)
                    .then(questions => {
                        if (!questions.length) {
                            return { questions, map: {} };
                        }
                        const map = _.keyBy(questions, 'id');
                        const qtOptions = {
                            raw: true,
                            language,
                            attributes: ['questionId', 'text']
                        };
                        if (ids) {
                            qtOptions.where = { questionId: { $in: ids } };
                        }
                        return textHandler.updateAllTexts(questions, language)
                            .then(() => {
                                return sequelize.models.question_action.findActionsPerQuestions(ids, language)
                                    .then(actions => {
                                        if (actions.length) {
                                            actions.forEach(action => {
                                                const q = map[action.questionId];
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
                            })
                            .then(() => {
                                return sequelize.models.question_choice.getAllQuestionChoices(ids, language)
                                    .then(choices => {
                                        const map = _.keyBy(questions, 'id');
                                        choices.forEach(choice => {
                                            const q = map[choice.questionId];
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
                                        return { questions, map };
                                    });
                            });
                    });
            },
            listQuestions(options = {}) {
                return Question._listQuestions(options)
                    .then(({ questions, map }) => {
                        const ids = options.ids;
                        if (ids) {
                            if (questions.length !== ids.length) {
                                return RRError.reject('qxNotFound');
                            }
                            return ids.map(id => map[id]);
                        } else {
                            return questions;
                        }
                    });
            }
        }
    });

    return Question;
};
