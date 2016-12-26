'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_identifier', {
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: 'identifier'
        },
        identifier: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: 'identifier'
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
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['question_id', 'question_choice_id'] }]
    });
};