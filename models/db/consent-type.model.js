'use strict';

module.exports = function consentType(sequelize, Sequelize, schema) {
    return sequelize.define('consent_type', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
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
