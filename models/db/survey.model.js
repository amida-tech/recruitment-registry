'use strict';

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
