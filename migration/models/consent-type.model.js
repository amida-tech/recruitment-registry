'use strict';

module.exports = function (sequelize, DataTypes) {
    const ConsentType = sequelize.define('consent_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return ConsentType;
};
