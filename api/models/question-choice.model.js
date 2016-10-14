'use strict';

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
        text: {
            type: DataTypes.TEXT
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
                    .then(({ id }) => ({ id }));
            },
            findChoicesPerQuestion(questionId) {
                return QuestionChoice.findAll({
                    raw: true,
                    where: { questionId },
                    attributes: ['id', 'text', 'type']
                });
            },
            getAllQuestionChoices(questionIds) {
                const options = {
                    raw: true,
                    attributes: ['id', 'text', 'type', 'questionId'],
                    order: 'line'
                };
                if (questionIds) {
                    options.where = { questionId: { in: questionIds } };
                }
                return QuestionChoice.findAll(options);
            }
        }
    });

    return QuestionChoice;
};
