'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('survey', {
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'published',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'survey_status',
                },
                key: 'name',
            },
        },
        version: {
            type: DataTypes.INTEGER,
        },
        groupId: {
            type: DataTypes.INTEGER,
            field: 'group_id',
        },
        meta: {
            type: DataTypes.JSON,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
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
        paranoid: true,
    });
};
