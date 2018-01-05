'use strict';

const names = require('../const-names');

module.exports = function survey(sequelize, Sequelize, schema) {
    const tableName = 'survey';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        status: {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: 'published',
            references: {
                model: {
                    schema,
                    tableName: 'survey_status',
                },
                key: 'name',
            },
        },
        version: {
            type: Sequelize.INTEGER,
        },
        groupId: {
            type: Sequelize.INTEGER,
            field: 'group_id',
        },
        meta: {
            type: Sequelize.JSON,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        authorId: {
            type: Sequelize.INTEGER,
            field: 'author_id',
            references: {
                model: {
                    schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'survey_type',
                },
                key: 'name',
            },
            defaultValue: names.defaultSurveyType,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
