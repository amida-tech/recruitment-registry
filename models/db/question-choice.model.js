'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('question_choice', {
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
        enumerationId: {
            type: DataTypes.INTEGER,
            field: 'enumeration_id',
            references: {
                model: 'enumeration',
                key: 'id'
            }
        },
        meta: {
            type: DataTypes.JSON
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
        updatedAt: 'updatedAt'
    });
};
