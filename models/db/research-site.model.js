'use strict';

module.exports = function researchSite(sequelize, Sequelize, schema) {
    const tableName = 'research_site';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        phone: {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: '999-999-9999',
        },
        ext: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        phone2: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        ext2: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        street: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        street2: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        city: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        state: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        zip: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
