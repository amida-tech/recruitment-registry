'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
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
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            createActionsTx: function (id, actions, tx) {
                if (actions && actions.length) {
                    return sequelize.Promise.all(actions.map(function (action, index) {
                            const record = {
                                questionId: id,
                                text: action.text,
                                type: action.type,
                                line: index
                            };
                            return sequelize.models.question_action.create(record, { transaction: tx });
                        }))
                        .then(() => ({ id }));
                } else {
                    return sequelize.Promise.resolve({ id });
                }
            },
            auxCreateQuestionTx: function (question, tx) {
                const qxFields = _.omit(question, ['oneOfChoices', 'choices', 'actions']);
                return Question.create(qxFields, { transaction: tx })
                    .then(created => {
                        const text = question.text;
                        const questionId = created.id;
                        return sequelize.models.question_text.createQuestionTextTx({ text, questionId }, tx)
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
                            return sequelize.Promise.all(choices.map(function (c, index) {
                                const choice = {
                                    questionId: created.id,
                                    text: c.text,
                                    type: c.type || 'bool',
                                    line: index
                                };
                                return sequelize.models.question_choice.create(choice, {
                                    transaction: tx
                                }).then(() => created);
                            })).then(() => created);
                        }
                        return created;
                    });
            },
            createQuestionTx: function (question, tx) {
                const qx = Object.assign({}, question, { version: 1 });
                return Question.auxCreateQuestionTx(qx, tx)
                    .then(created => created.update({ groupId: created.id }, { transaction: tx }))
                    .then(({ id }) => id);
            },
            createQuestion: function (question) {
                return sequelize.transaction(function (tx) {
                    return Question.createQuestionTx(question, tx);
                });
            },
            replaceQuestion: function (id, replacement) {
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
                                        const newQuestion = Object.assign({}, replacement, {
                                            version: question.version + 1,
                                            groupId: question.groupId
                                        });
                                        return Question.auxCreateQuestionTx(newQuestion, tx)
                                            .then(({ id }) => id);
                                    })
                                    .then((newIdObj) => {
                                        return Question.destroy({ where: { id } }, { transaction: tx })
                                            .then(() => {
                                                return sequelize.models.survey_question.destroy({ where: { questionId: id } });
                                            })
                                            .then(() => ({ id: newIdObj }));
                                    });
                            });
                        }
                    });
            },
            getQuestion: function (id, language = 'en') {
                return Question.findById(id, { raw: true, attributes: ['id', 'type'] })
                    .then(question => {
                        if (!question) {
                            return RRError.reject('qxNotFound');
                        }
                        return question;
                    })
                    .then(question => {
                        return sequelize.models.question_text.getQuestionText(id, language)
                            .then(text => {
                                question.text = text || '';
                                return question;
                            });
                    })
                    .then(question => {
                        return sequelize.models.question_action.findAll({
                                where: { questionId: question.id },
                                raw: true,
                                attributes: ['text', 'type', 'line']
                            })
                            .then(actions => {
                                if (actions.length) {
                                    const sortedActions = _.sortBy(actions, 'line');
                                    question.actions = sortedActions.map(({ text, type }) => ({ text, type }));
                                }
                                return question;
                            });
                    })
                    .then(question => {
                        if (['choice', 'choices'].indexOf(question.type) < 0) {
                            return question;
                        }
                        return sequelize.models.question_choice.findAll({
                                where: { questionId: question.id },
                                raw: true,
                                attributes: ['id', 'text', 'type']
                            })
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
            updateQuestion: function (id, { text }) {
                return sequelize.models.question_text.createQuestionText({ questionId: id, text });
            },
            deleteQuestion: function (id) {
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
            getQuestionsCommon: function (options, choiceOptions, language) {
                return Question.findAll(options)
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
                        if (choiceOptions.where) {
                            qtOptions.where = choiceOptions.where;
                        }
                        return sequelize.models.question_text.findAll(qtOptions)
                            .then(qxTexts => {
                                if (language === 'en') {
                                    return qxTexts;
                                } else {
                                    const nullOnes = qxTexts.filter(qxText => !qxText.text);
                                    if (nullOnes.length) {
                                        const ids = nullOnes.map(nullOne => nullOne.questionId);
                                        const qtOptions = {
                                            raw: true,
                                            language: 'en',
                                            attributes: ['questionId', 'text'],
                                            where: { questionId: { in: ids } }
                                        };
                                        return sequelize.models.question_text.findAll(qtOptions)
                                            .then(addlQxTexts => {
                                                const map = _.keyBy(addlQxTexts, 'questionId');
                                                nullOnes.forEach(nullOne => {
                                                    const qxText = map[nullOne.questionId];
                                                    const text = (qxText && qxText.text) || '';
                                                    nullOne.text = text;
                                                });
                                            });
                                    } else {
                                        return qxTexts;
                                    }
                                }
                            })
                            .then(qxTexts => {
                                qxTexts.forEach(qxText => {
                                    const q = map[qxText.questionId];
                                    if (q) {
                                        q.text = qxText.text;
                                    }
                                });
                            })
                            .then(() => {
                                return sequelize.models.question_action.findAll(choiceOptions)
                                    .then(actions => {
                                        if (actions.length) {
                                            actions.forEach(action => {
                                                const q = map[action.questionId];
                                                if (q) {
                                                    delete action.questionId;
                                                    delete action.id;
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
                                return sequelize.models.question_choice.findAll(choiceOptions)
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
            getQuestions: function (ids, language = 'en') {
                const options = {
                    where: { id: { in: ids } },
                    raw: true,
                    attributes: ['id', 'type'],
                    order: 'id'
                };
                const choicesOptions = {
                    where: { questionId: { in: ids } },
                    raw: true,
                    attributes: ['id', 'text', 'type', 'questionId'],
                    order: 'line'
                };
                return Question.getQuestionsCommon(options, choicesOptions, language)
                    .then(({ questions, map }) => {
                        if (questions.length !== ids.length) {
                            return RRError.reject('qxNotFound');
                        }
                        return { questions, map };
                    })
                    .then(({ map }) => ids.map(id => map[id]));
            },
            getAllQuestions: function (language = 'en') {
                const options = {
                    raw: true,
                    attributes: ['id', 'type'],
                    order: 'id'
                };
                const choicesOptions = {
                    raw: true,
                    attributes: ['id', 'text', 'type', 'questionId'],
                    order: 'line'
                };
                return Question.getQuestionsCommon(options, choicesOptions, language)
                    .then(({ questions }) => questions);
            }
        }
    });

    return Question;
};
