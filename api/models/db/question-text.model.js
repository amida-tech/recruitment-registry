'use strict';

module.exports = function (sequelize, DataTypes) {
    const QuestionText = sequelize.define('question_text', {
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'question_id',
            references: {
                model: 'question',
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
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return QuestionText;
};
