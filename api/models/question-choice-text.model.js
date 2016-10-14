'use strict';

const textTableMethodsFn = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {

    const QuestionChoiceText = sequelize.define('question_choice_text', {
        questionChoiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'question_choice_text',
            references: {
                model: 'question_choice',
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
        classMethods: textTableMethodsFn(sequelize, 'question_choice_text', 'questionChoiceId')
    });

    return QuestionChoiceText;
};
