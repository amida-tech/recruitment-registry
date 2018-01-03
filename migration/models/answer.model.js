'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('answer', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        questionChoiceId: {
            type: DataTypes.INTEGER,
            field: 'question_choice_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        multipleIndex: {
            type: DataTypes.INTEGER,
            field: 'multiple_index',
        },
        value: {
            type: DataTypes.TEXT,
        },
        meta: {
            type: DataTypes.JSON,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
            defaultValue: sequelize.literal('NOW()'),
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
