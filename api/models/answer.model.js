'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const uiToDbAnswer = function (answer) {
        let result = [];
        if (answer.hasOwnProperty('choices')) {
            answer.choices.forEach(choice => {
                result.push({
                    value: choice,
                    type: 'choice'
                });
            });
        }
        if (answer.hasOwnProperty('choice')) {
            result.push({
                value: answer.choice,
                type: 'choice'
            });
        }
        if (answer.hasOwnProperty('boolValue')) {
            result.push({
                value: answer.boolValue,
                type: 'bool'
            });
        }
        if (answer.hasOwnProperty('textValue')) {
            result.push({
                value: answer.textValue,
                type: 'text'
            });
        }
        return result;
    };

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
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'answer_type_id',
            references: {
                model: 'answer_type',
                key: 'name'
            }
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
            createAnswersTx: function ({ userId, surveyId, answers }, tx) {
                // TO DO: Put an assertion here to check the answers match with question type
                answers = answers.reduce((r, q) => {
                    const questionId = q.questionId;
                    const values = uiToDbAnswer(q.answer).map(value => ({
                        userId,
                        surveyId,
                        questionId,
                        value: value.value,
                        type: value.type
                    }));
                    values.forEach(value => r.push(value));
                    return r;
                }, []);
                // TODO: Switch to bulkCreate when Sequelize 4 arrives
                return sequelize.Promise.all(answers.map(function (answer) {
                    return Answer.create(answer, { transaction: tx });
                }));
            },
            updateAnswersTx: function ({ userId, surveyId, answers }, tx) {
                const ids = _.map(answers, 'questionId');
                return Answer.destroy({
                        where: {
                            questionId: { in: ids },
                            surveyId,
                            userId
                        },
                        transaction: tx
                    })
                    .then(function () {
                        answers = _.filter(answers, answer => answer.answer);
                        if (answers.length) {
                            return Answer.createAnswersTx({
                                userId,
                                surveyId,
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
            updateAnswers: function (input) {
                return sequelize.transaction(function (tx) {
                    return Answer.updateAnswersTx(input, tx);
                });
            },
            getSurveyAnswers: function (input) {
                const generateAnswer = {
                    text: entries => ({ textValue: entries[0].value }),
                    bool: entries => ({ boolValue: entries[0].value === 'true' }),
                    choice: entries => ({ choice: parseInt(entries[0].value, 10) }),
                    choices: entries => {
                        let choices = entries.map(r => parseInt(r.value, 10));
                        choices = _.sortBy(choices);
                        return { choices };
                    },
                    choicesplus: entries => {
                        const freeChoiceArr = _.remove(entries, ['type', 'text']);
                        const result = generateAnswer.choices(entries);
                        if (freeChoiceArr && freeChoiceArr.length) {
                            result.textValue = freeChoiceArr[0].value;
                        }
                        return result;
                    }
                };
                return sequelize.query('select a.value as value, a.answer_type_id as type, q.type as qtype, q.id as qid from answer a, question q where a.user_id = :userid and a.survey_id = :surveyid and a.question_id = q.id', {
                        replacements: {
                            userid: input.userId,
                            surveyid: input.surveyId
                        },
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(function (result) {
                        const groupedResult = _.groupBy(result, 'qid');
                        return Object.keys(groupedResult).map(function (key) {
                            const v = groupedResult[key];
                            return {
                                questionId: v[0].qid,
                                answer: generateAnswer[v[0].qtype](v)
                            };
                        });
                    });
            }
        }
    });

    return Answer;
};
