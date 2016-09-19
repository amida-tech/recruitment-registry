'use strict';

const _ = require('lodash');

const query = 'select question.text as text, question_type.name as type from question, question_type where question.id = :id and question.type = question_type.id';
const queryChoices = 'select id, text from question_choices where question_id = :id order by line';
const queryMultiple = 'select question.id as id, question.text as text, question_type.name as type from question, question_type where question.deleted_at is null and question.id in (:ids) and question.type = question_type.id';
const queryChoicesMultiple = 'select id, text, question_id as qid from question_choices where question_id in (:ids) order by line';
const queryAll = 'select question.id as id, question.text as text, question_type.name as type from question, question_type where question.deleted_at is null and question.type = question_type.id order by id';
const queryChoicesAll = 'select id, text, question_id as qid from question_choices order by line';

module.exports = function (sequelize, DataTypes) {
    const Question = sequelize.define('question', {
        text: {
            type: DataTypes.TEXT
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'question_type',
                key: 'id'
            },
            get: function () {
                const id = this.getDataValue('type');
                return sequelize.models.question_type.nameById(id);
            },
            set: function (type) {
                const id = sequelize.models.question_type.idByName(type);
                this.setDataValue('type', id);
            }
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
            createQuestionTx: function ({ text, type, choices }, tx) {
                return Question.create({ text, type }, { transaction: tx })
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
                return sequelize.query(query, {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }).then(function (questions) {
                    const question = questions[0];
                    if (!question) {
                        return sequelize.Promise.reject('No such question');
                    }
                    return question;
                }).then(function (question) {
                    return sequelize.query(queryChoices, {
                        replacements: {
                            id
                        },
                        type: sequelize.QueryTypes.SELECT
                    }).then((choices) => {
                        if (choices && choices.length) {
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
                return Question.destroy({
                    where: { id }
                });
            },
            getQuestionsCommon: function (query, queryChoices, options) {
                return sequelize.query(query, options).then(questions => {
                    const question = questions[0];
                    if (!question) {
                        return sequelize.Promise.reject('No such question');
                    }
                    return questions;
                }).then(questions => {
                    return sequelize.query(queryChoices, options).then((choices) => {
                        const map = _.keyBy(questions, 'id');
                        if (choices && choices.length) {
                            choices.forEach(function (choice) {
                                const q = map[choice.qid];
                                if (q) {
                                    delete choice.qid;
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
                return Question.getQuestionsCommon(queryMultiple, queryChoicesMultiple, {
                        replacements: { ids },
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(({ map }) => ids.map(id => map[id]));
            },
            getAllQuestions: function () {
                return Question.getQuestionsCommon(queryAll, queryChoicesAll, {
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(({ questions }) => questions);
            }
        }
    });

    return Question;
};
