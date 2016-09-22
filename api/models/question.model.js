'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const QX_TYPES_W_CHOICES = ['choice', 'choices', 'choicesplus'];
    const QX_FIND_ATTRS = ['id', 'text', 'type', 'additionalText'];

    const cleanQx = function (question) {
        if ((question.type !== 'choicesplus') || (question.additionalText === null)) {
            delete question.additionalText;
        }
        return question;
    };

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
        additionalText: {
            type: DataTypes.TEXT,
            field: 'additional_text'
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
            createQuestionTx: function ({ text, type, choices, additionalText }, tx) {
                return Question.create({ text, type, additionalText }, { transaction: tx })
                    .then(({ id }) => {
                        if (choices && choices.length) {
                            return sequelize.Promise.all(choices.map(function (c, index) {
                                const choice = {
                                    questionId: id,
                                    text: c,
                                    line: index
                                };
                                return sequelize.models.question_choices.create(choice, {
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
                            return sequelize.Promise.reject('No such question');
                        }
                        return cleanQx(question);
                    })
                    .then(question => {
                        if (QX_TYPES_W_CHOICES.indexOf(question.type) < 0) {
                            return question;
                        }
                        return sequelize.models.question_choices.findAll({
                                where: { questionId: question.id },
                                raw: true,
                                attributes: ['id', 'text']
                            })
                            .then(choices => {
                                if (choices.length) {
                                    question.choices = choices;
                                }
                                return question;
                            });
                    });
            },
            updateQuestion: function (id, { text }) {
                return Question.findById(id).then(qx => qx.update({ text }));
            },
            deleteQuestion: function (id) {
                return Question.destroy({ where: { id } });
            },
            getQuestionsCommon: function (options, choiceOptions) {
                return Question.findAll(options)
                    .then(questions => {
                        const question = questions[0];
                        if (!question) {
                            return sequelize.Promise.reject('No such question');
                        }
                        return questions.map(cleanQx);
                    })
                    .then(questions => {
                        return sequelize.models.question_choices.findAll(choiceOptions)
                            .then(choices => {
                                const map = _.keyBy(questions, 'id');
                                if (choices.length) {
                                    choices.forEach(choice => {
                                        const q = map[choice.questionId];
                                        if (q) {
                                            delete choice.questionId;
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
                    attributes: ['id', 'text', 'questionId'],
                    order: 'line'
                };
                return Question.getQuestionsCommon(options, choicesOptions)
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
                    attributes: ['id', 'text', 'questionId'],
                    order: 'line'
                };
                return Question.getQuestionsCommon(options, choicesOptions)
                    .then(({ questions }) => questions);
            }
        }
    });

    return Question;
};
