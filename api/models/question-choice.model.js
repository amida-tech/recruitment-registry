'use strict';

const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'question_choice_text', 'questionChoiceId');

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
                        const input = { questionChoiceId: id, text: choice.text };
                        return textHandler.createTextTx(input, tx)
                            .then(() => ({ id }));
                    });
            },
            findChoicesPerQuestion(questionId) {
                return QuestionChoice.findAll({
                        raw: true,
                        where: { questionId },
                        attributes: ['id', 'type']
                    })
                    .then(choices => textHandler.updateAllTexts(choices));
            },
            getAllQuestionChoices(questionIds) {
                const options = {
                    raw: true,
                    attributes: ['id', 'type', 'questionId'],
                    order: 'line'
                };
                if (questionIds) {
                    options.where = { questionId: { $in: questionIds } };
                }
                return QuestionChoice.findAll(options)
                    .then(choices => textHandler.updateAllTexts(choices));
            }
        }
    });

    return QuestionChoice;
};
