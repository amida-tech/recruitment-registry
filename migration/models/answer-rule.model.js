'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('answer_rule', {
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
        logic: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'answer_rule_logic',
                },
                key: 'name',
            },
        },
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            allowNull: true,
            onDelete: 'SET NULL',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        sectionId: {
            type: DataTypes.INTEGER,
            field: 'section_id',
            allowNull: true,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'section',
                },
                key: 'id',
            },
        },
        answerQuestionId: {
            type: DataTypes.INTEGER,
            field: 'answer_question_id',
            allowNull: true,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        line: {
            type: DataTypes.INTEGER,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
