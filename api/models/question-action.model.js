'use strict';

module.exports = function (sequelize, DataTypes) {
    const QuestionAction = sequelize.define('question_action', {
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
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        line: {
            type: DataTypes.INTEGER
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        classMethods: {
            createActionPerQuestionTx(questionId, { text, type }, line, tx) {
                const r = { questionId, text, type, line };
                return QuestionAction.create(r, { transaction: tx });
            },
            createActionsPerQuestionTx(questionId, actions, tx) {
                return sequelize.Promise.all(actions.map((action, index) => {
                    return QuestionAction.createActionPerQuestionTx(questionId, action, index, tx);
                }));
            },
            findActionsPerQuestion(questionId) {
                return QuestionAction.findAll({
                    raw: true,
                    where: { questionId },
                    attributes: ['id', 'text', 'type'],
                    order: 'line'
                });
            },
            findActionsPerQuestions(ids) {
                const options = {
                    raw: true,
                    attributes: ['id', 'text', 'type', 'questionId'],
                    order: 'line'
                };
                if (ids) {
                    options.where = { questionId: { $in: ids } };
                }
                return QuestionAction.findAll(options);
            }
        }
    });

    return QuestionAction;
};
