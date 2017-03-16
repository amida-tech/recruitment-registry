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
        },
        schema: {
            type: Sequelize.TEXT,
            allowNull: true,
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
        return registry(queryInterface, Sequelize)
        .then(() => queryInterface.addIndex('registry', ['name'], {
            indexName: 'registry_name',
            unique: true,
            where: { deleted_at: { $eq: null } },
        }))
        .then(() => queryInterface.addIndex('registry', ['url'], {
            indexName: 'registry_url',
            unique: true,
            where: { deleted_at: { $eq: null } },
        }))
        .then(() => queryInterface.addIndex('registry', ['schema'], {
            indexName: 'registry_schema',
            unique: true,
            where: { deleted_at: { $eq: null } },
        }));
    },

    down(queryInterface) {
        return queryInterface.dropTable('registry');
    },
};
