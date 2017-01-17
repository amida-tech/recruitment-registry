'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('question', {
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'question_type',
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
        version: {
            type: DataTypes.INTEGER
        },
        groupId: {
            type: DataTypes.INTEGER,
            field: 'group_id'
        },
        meta: {
            type: DataTypes.JSON
        },
        multiple: {
            type: DataTypes.BOOLEAN
        },
        maxCount: {
            type: DataTypes.INTEGER,
            field: 'max_count'
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
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};
