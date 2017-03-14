'use strict';

module.exports = function registry(sequelize, Sequelize, schema) {
    return sequelize.define('registry', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: true,
            unique: true,
        },
        schema: {
            type: Sequelize.TEXT,
            allowNull: true,
            unique: true,
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
