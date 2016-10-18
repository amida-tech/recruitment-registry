'use strict';

module.exports = function (sequelize, DataTypes) {
    const QuestionActionText = sequelize.define('question_action_text', {
        questionActionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'question_action_text',
            references: {
                model: 'question_action',
                key: 'id'
            }
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            fieldName: 'language_code',
            references: {
                model: 'language',
                key: 'code'
            }
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    });

    return QuestionActionText;
};
