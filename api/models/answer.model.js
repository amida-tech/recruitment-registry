'use strict';

var _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const Answer = sequelize.define('answer', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'user',
                key: 'id'
            }
        },
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        classMethods: {
            createAnswersTx: function (input, tx) {
                const userId = input.userId;
                const surveyId = input.surveyId;
                const answers = input.answers.reduce(function (r, q) {
                    const answer = q.answer;
                    let values = answer.choices;
                    if (!values) {
                        if (answer.hasOwnProperty('choice')) {
                            values = answer.choice;
                        } else if (answer.hasOwnProperty('boolValue')) {
                            values = answer.boolValue;
                        } else if (answer.hasOwnProperty('textValue')) {
                            values = answer.textValue;
                        }
                    }
                    if (!Array.isArray(values)) {
                        values = [values];
                    }
                    const questionId = q.questionId;
                    values.forEach(function (value) {
                        r.push({
                            userId,
                            surveyId,
                            questionId,
                            value
                        });
                    });
                    return r;
                }, []);
                // Switch to bulkCreate when Sequelize 4 arrives
                return sequelize.Promise.all(answers.map(function (answer) {
                    return Answer.create(answer, {
                        transaction: tx
                    });
                }));
            },
            updateAnswersTx: function (input, tx) {
                const ids = _.map(input.answers, 'questionId');
                return Answer.destroy({
                    where: {
                        questionId: { in: ids
                        },
                        surveyId: input.surveyId,
                        userId: input.userId
                    },
                    transaction: tx
                }).then(function () {
                    const answers = _.filter(input.answers, answer => answer.answer);
                    if (answers.length) {
                        return Answer.createAnswersTx({
                            userId: input.userId,
                            surveyId: input.surveyId,
                            answers
                        }, tx);
                    }
                });
            },
            createAnswers: function (input) {
                return sequelize.transaction(function (tx) {
                    return Answer.createAnswersTx(input, tx);
                });
            },
            getSurveyAnswers: function (input) {
                const generateAnswer = {
                    text: entries => ({
                        textValue: entries[0].value
                    }),
                    bool: entries => ({
                        boolValue: entries[0].value === 'true'
                    }),
                    choice: entries => ({
                        choice: parseInt(entries[0].value, 10)
                    }),
                    choices: entries => {
                        entries = entries.map(r => parseInt(r.value, 10));
                        entries = _.sortBy(entries);
                        return {
                            choices: entries
                        };
                    }
                };
                return sequelize.query('select a.value as value, qt.name as type, q.id as qid from answer a, question q, question_type qt where a.user_id = :user_id and a.survey_id = :survey_id and a.question_id = q.id and q.type = qt.id', {
                    replacements: {
                        user_id: input.userId,
                        survey_id: input.surveyId
                    },
                    type: sequelize.QueryTypes.SELECT
                }).then(function (result) {
                    const groupedResult = _.groupBy(result, 'qid');
                    return Object.keys(groupedResult).map(function (key) {
                        var v = groupedResult[key];
                        return {
                            questionId: v[0].qid,
                            answer: generateAnswer[v[0].type](v)
                        };
                    });
                });
            }
        }
    });

    return Answer;
};
