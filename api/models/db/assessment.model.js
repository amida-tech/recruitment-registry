'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('assessment', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        sequenceType: {
            type: DataTypes.ENUM('ondemand', 'biyearly'),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'cupdated_at',
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
