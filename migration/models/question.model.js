'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('question', {
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question_type',
                },
                key: 'name',
            },
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
        multiple: {
            type: DataTypes.BOOLEAN,
        },
        maxCount: {
            type: DataTypes.INTEGER,
            field: 'max_count',
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
