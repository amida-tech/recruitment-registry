'use strict';

const consentRole = function (queryInterface, Sequelize) {
    return queryInterface.createTable('consent_role', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};

const consentTypeColumnRole = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('consent_type', 'role', {
        type: Sequelize.TEXT,
        references: {
            model: 'consent_role',
            key: 'name',
        },
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return consentRole(queryInterface, Sequelize)
            .then(() => consentTypeColumnRole(queryInterface, Sequelize))
            .then(() => queryInterface.sequelize.query('INSERT INTO consent_role(name, created_at) VALUES (\'participant\', NOW())'))
            .then(() => queryInterface.sequelize.query('INSERT INTO consent_role(name, created_at) VALUES (\'clinician\', NOW())'));
    },
};
