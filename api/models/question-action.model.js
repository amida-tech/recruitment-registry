'use strict';

const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'question_action_text', 'questionActionId');

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
                const r = { questionId, type, line };
                return QuestionAction.create(r, { transaction: tx })
                    .then(({ id }) => textHandler.createTextTx({ id, text }, tx));
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
                        attributes: ['id', 'type'],
                        order: 'line'
                    })
                    .then(actions => textHandler.updateAllTexts(actions));
            },
            findActionsPerQuestions(ids) {
                const options = {
                    raw: true,
                    attributes: ['id', 'type', 'questionId'],
                    order: 'line'
                };
                if (ids) {
                    options.where = { questionId: { $in: ids } };
                }
                return QuestionAction.findAll(options)
                    .then(actions => textHandler.updateAllTexts(actions));
            }
        }
    });

    return QuestionAction;
};
