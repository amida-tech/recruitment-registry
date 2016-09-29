'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const QX_TYPES_W_CHOICES = ['choice', 'choices'];
    const QX_FIND_ATTRS = ['id', 'text', 'type', 'selectable'];

    const Question = sequelize.define('question', {
        text: {
            type: DataTypes.TEXT
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'question_type',
                key: 'name'
            },
        },
        selectable: {
            type: DataTypes.BOOLEAN,
            allowNull: false
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
            createQuestionTx: function ({ text, type, selectable, oneOfChoices, choices }, tx) {
                const nOneOfChoices = (oneOfChoices && oneOfChoices.length) || 0;
                const nChoices = (choices && choices.length) || 0;
                if (nOneOfChoices && nChoices) {
                    return RRError.reject('qxCreateChoicesBoth');
                }
                if ((type === 'choices') && !nChoices) {
                    return RRError.reject('qxCreateChoicesNone');
                }
                if ((type === 'choice') && !(nOneOfChoices || nChoices)) {
                    return RRError.reject('qxCreateChoiceNone');
                }
                if ((type === 'choice') && nChoices) {
                    const notBoolChoices = choices.filter((choice) => !(_.isNil(choice.type) || (choice.type === 'bool')));
                    if (notBoolChoices.length) {
                        return RRError.reject('qxCreateChoiceNotBool');
                    }
                }
                if ((type !== 'choice') && (type !== 'choices') && (nOneOfChoices || nChoices)) {
                    return RRError.reject('qxCreateChoicesOther');
                }
                return Question.create({ text, type, selectable }, { transaction: tx })
                    .then(({ id }) => {
                        if (nOneOfChoices || nChoices) {
                            if (nOneOfChoices) {
                                choices = oneOfChoices.map(text => ({ text, type: 'bool' }));
                            }
                            return sequelize.Promise.all(choices.map(function (c, index) {
                                const choice = {
                                    questionId: id,
                                    text: c.text,
                                    type: c.type || 'bool',
                                    line: index
                                };
                                return sequelize.models.question_choice.create(choice, {
                                    transaction: tx
                                }).then(() => id);
                            })).then(() => id);
                        }
                        return id;
                    });
            },
            createQuestion: function (question) {
                return sequelize.transaction(function (tx) {
                    return Question.createQuestionTx(question, tx);
                });
            },
            getQuestion: function (id) {
                return Question.findById(id, { raw: true, attributes: QX_FIND_ATTRS })
                    .then(question => {
                        if (!question) {
                            return RRError.reject('qxNotFound');
                        }
                        return question;
                    })
                    .then(question => {
                        if (QX_TYPES_W_CHOICES.indexOf(question.type) < 0) {
                            return question;
                        }
                        return sequelize.models.question_choice.findAll({
                                where: { questionId: question.id },
                                raw: true,
                                attributes: ['id', 'text', 'type']
                            })
                            .then(choices => {
                                if (choices.length) {
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
                                }
                                return question;
                            });
                    });
            },
            updateQuestion: function (id, { text, selectable }) {
                const updateObj = {};
                if (text !== undefined) {
                    updateObj.text = text;
                }
                if (selectable !== undefined) {
                    updateObj.selectable = selectable;
                }
                return Question.findById(id).then(qx => qx.update(updateObj));
            },
            deleteQuestion: function (id) {
                return Question.destroy({ where: { id } });
            },
            getQuestionsCommon: function (options, choiceOptions) {
                return Question.findAll(options)
                    .then(questions => {
                        if (!questions.length) {
                            return { questions, map: {} };
                        }
                        return sequelize.models.question_choice.findAll(choiceOptions)
                            .then(choices => {
                                const map = _.keyBy(questions, 'id');
                                if (choices.length) {
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
                                }
                                return { questions, map };
                            });
                    });
            },
            getQuestions: function (ids) {
                const options = {
                    where: { id: { in: ids } },
                    raw: true,
                    attributes: QX_FIND_ATTRS,
                    order: 'id'
                };
                const choicesOptions = {
                    where: { questionId: { in: ids } },
                    raw: true,
                    attributes: ['id', 'text', 'type', 'questionId'],
                    order: 'line'
                };
                return Question.getQuestionsCommon(options, choicesOptions)
                    .then(({ questions, map }) => {
                        if (questions.length !== ids.length) {
                            return RRError.reject('qxNotFound');
                        }
                        return { questions, map };
                    })
                    .then(({ map }) => ids.map(id => map[id]));
            },
            getAllQuestions: function () {
                const options = {
                    raw: true,
                    attributes: QX_FIND_ATTRS,
                    order: 'id'
                };
                const choicesOptions = {
                    raw: true,
                    attributes: ['id', 'text', 'type', 'questionId'],
                    order: 'line'
                };
                return Question.getQuestionsCommon(options, choicesOptions)
                    .then(({ questions }) => questions);
            }
        }
    });

    return Question;
};
