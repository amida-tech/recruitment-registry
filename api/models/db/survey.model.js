'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('survey', {
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
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};
