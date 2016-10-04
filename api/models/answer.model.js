'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const uiToDbAnswer = function (answer) {
        let result = [];
        if (answer.hasOwnProperty('choices')) {
            answer.choices.forEach(choice => {
                const dbAnswer = {
                    questionChoiceId: choice.id
                };
                if (choice.hasOwnProperty('textValue')) {
                    dbAnswer.value = choice.textValue;
                    dbAnswer.type = 'text';
                } else if (choice.hasOwnProperty('boolValue')) {
                    dbAnswer.value = (choice.boolValue ? 'true' : 'false');
                    dbAnswer.type = 'bool';
                } else {
                    dbAnswer.value = 'true';
                    dbAnswer.type = 'bool';
                }
                result.push(dbAnswer);
            });
        }
        if (answer.hasOwnProperty('choice')) {
            result.push({
                questionChoiceId: answer.choice,
                type: 'choice'
            });
        }
        if (answer.hasOwnProperty('boolValue')) {
            result.push({
                value: answer.boolValue ? 'true' : 'false',
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

    const generateAnswer = {
        text: entries => ({ textValue: entries[0].value }),
        bool: entries => ({ boolValue: entries[0].value === 'true' }),
        choice: entries => ({ choice: entries[0].questionChoiceId }),
        choices: entries => {
            let choices = entries.map(r => {
                const answer = { id: r.questionChoiceId };
                if (r.type === 'text') {
                    answer.textValue = r.value;
                } else if (r.type === 'bool') {
                    answer.boolValue = (r.value === 'true');
                }
                return answer;
            });
            choices = _.sortBy(choices, 'id');
            return { choices };
        }
    };

    const Answer = sequelize.define('answer', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'registry_user',
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
        questionChoiceId: {
            type: DataTypes.INTEGER,
            field: 'question_choice_id',
            references: {
                model: 'question_choice',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.TEXT
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
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            createAnswersTx: function ({ userId, surveyId, answers }, tx) {
                // TO DO: Put an assertion here to check the answers match with question type
                answers = answers.reduce((r, q) => {
                    const questionId = q.questionId;
                    const values = uiToDbAnswer(q.answer).map(value => ({
                        userId,
                        surveyId,
                        questionId,
                        questionChoiceId: value.questionChoiceId || null,
                        value: value.hasOwnProperty('value') ? value.value : null,
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
            getAnswers: function ({ userId, surveyId }) {
                return sequelize.query('select a.question_choice_id as "questionChoiceId", a.value as value, a.answer_type_id as type, q.type as qtype, q.id as qid from answer a, question q where a.deleted_at is null and a.user_id = :userid and a.survey_id = :surveyid and a.question_id = q.id', {
                        replacements: {
                            userid: { userId, surveyId }.userId,
                            surveyid: { userId, surveyId }.surveyId
                        },
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(function (result) {
                        const groupedResult = _.groupBy(result, 'qid');
                        return Object.keys(groupedResult).map(function (key) {
                            const v = groupedResult[key];
                            const r = {
                                questionId: v[0].qid,
                                answer: generateAnswer[v[0].qtype](v)
                            };
                            return r;
                        });
                    });
            },
            getOldAnswers: function ({ userId, surveyId }) {
                return Answer.findAll({
                        paranoid: false,
                        where: { userId, surveyId, deletedAt: { $ne: null } },
                        raw: true,
                        order: 'deleted_at',
                        attributes: [
                            'questionChoiceId',
                            'value',
                            'type',
                            'questionId', [sequelize.fn('to_char', sequelize.col('deleted_at'), 'SSSS.MS'), 'deletedAt']
                        ]
                    })
                    .then(rawAnswers => {
                        const qidGrouped = _.groupBy(rawAnswers, 'questionId');
                        const qids = Object.keys(qidGrouped);
                        return sequelize.models.question.findAll({
                                where: { id: { $in: qids } },
                                raw: true,
                                attributes: ['id', 'type']
                            })
                            .then(rawQuestions => _.keyBy(rawQuestions, 'id'))
                            .then(qxMap => {
                                const rmGrouped = _.groupBy(rawAnswers, 'deletedAt');
                                return Object.keys(rmGrouped).reduce(function (r, date) {
                                    const rmGroup = rmGrouped[date];
                                    const qxGrouped = _.groupBy(rmGroup, 'questionId');
                                    const newValue = Object.keys(qxGrouped).map(function (qid) {
                                        const qxGroup = qxGrouped[qid];
                                        return {
                                            questionId: parseInt(qid),
                                            answer: generateAnswer[qxMap[qid].type](qxGroup)
                                        };
                                    });
                                    r[date] = _.sortBy(newValue, 'questionId');
                                    return r;
                                }, {});
                            });
                    });
            }
        }
    });

    return Answer;
};
