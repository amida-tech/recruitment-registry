'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('enumeration', {
        reference: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
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
        indexes: [{ unique: true, fields: ['reference'], where: { deleted_at: { $eq: null } } }],
        paranoid: true
    });
};
