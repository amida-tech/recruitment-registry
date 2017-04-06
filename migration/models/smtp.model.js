'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('smtp', {
        protocol: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        username: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        host: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        from: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'email_from',
        },
        otherOptions: {
            type: DataTypes.JSON,
            allowNull: false,
            field: 'other_options',
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
    });
};
