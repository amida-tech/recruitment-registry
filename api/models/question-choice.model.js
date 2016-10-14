'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const QuestionChoice = sequelize.define('question_choice', {
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            allowNull: false,
            references: {
                model: 'question',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'answer_type',
                key: 'name'
            },
        },
        line: {
            type: DataTypes.INTEGER
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        classMethods: {
            createQuestionChoiceTx(choice, tx) {
                return QuestionChoice.create(choice, { transaction: tx })
                    .then(({ id }) => {
                        const QuestionChoiceText = sequelize.models.question_choice_text;
                        const input = { questionChoiceId: id, text: choice.text };
                        return QuestionChoiceText.createQuestionChoiceTextTx(input, tx)
                            .then(() => ({ id }));
                    });
            },
            findChoicesPerQuestion(questionId) {
                return QuestionChoice.findAll({
                        raw: true,
                        where: { questionId },
                        attributes: ['id', 'type']
                    })
                    .then(choices => {
                        const ids = _.map(choices, 'id');
                        const QuestionChoiceText = sequelize.models.question_choice_text;
                        return QuestionChoiceText.getAllQuestionChoiceTexts(ids)
                            .then(records => {
                                const map = _.keyBy(records, 'questionChoiceId');
                                choices.forEach(choice => {
                                    const r = map[choice.id];
                                    choice.text = (r && r.text) || '';
                                });
                                return choices;
                            });
                    });
            },
            getAllQuestionChoices(questionIds) {
                const options = {
                    raw: true,
                    attributes: ['id', 'type', 'questionId'],
                    order: 'line'
                };
                if (questionIds) {
                    options.where = { questionId: { in: questionIds } };
                }
                return QuestionChoice.findAll(options)
                    .then(choices => {
                        const ids = _.map(choices, 'id');
                        const QuestionChoiceText = sequelize.models.question_choice_text;
                        return QuestionChoiceText.getAllQuestionChoiceTexts(ids)
                            .then(records => {
                                const map = _.keyBy(records, 'questionChoiceId');
                                choices.forEach(choice => {
                                    const r = map[choice.id];
                                    choice.text = (r && r.text) || '';
                                });
                                return choices;
                            });
                    });
            }
        }
    });

    return QuestionChoice;
};
