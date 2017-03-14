'use strict';

module.exports = function smtp(sequelize, Sequelize, schema) {
    return sequelize.define('smtp', {
        protocol: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        username: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        password: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        host: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        from: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'email_from',
        },
        otherOptions: {
            type: Sequelize.JSON,
            allowNull: false,
            field: 'other_options',
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
