'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('question_choice', {
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'answer_type',
                },
                key: 'name',
            },
        },
        code: {
            type: DataTypes.TEXT,
        },
        meta: {
            type: DataTypes.JSON,
        },
        line: {
            type: DataTypes.INTEGER,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        choiceSetId: {
            type: DataTypes.INTEGER,
            field: 'choice_set_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'choice_set',
                },
                key: 'id',
            },
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        indexes: [{
            fields: ['question_id'],
            where: { deleted_at: { [Op.eq]: null } },
        }, {
            fields: ['choice_set_id'],
            where: { deleted_at: { [Op.eq]: null } },
        }],
        paranoid: true,
    });
};
