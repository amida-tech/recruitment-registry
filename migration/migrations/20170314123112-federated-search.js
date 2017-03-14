'use strict';

const config = require('../../config');

const registry = function registry(queryInterface, Sequelize) {
    return queryInterface.createTable('registry', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
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
        schema: config.db.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return registry(queryInterface, Sequelize);
    },

    down(queryInterface) {
        return queryInterface.dropTable('registry');
    },
};
