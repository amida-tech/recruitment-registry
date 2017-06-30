'use strict';

const smtpType = function (queryInterface, Sequelize) {
    return queryInterface.createTable('smtp_type', {
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

const smtpColumnType = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('smtp', 'type', {
        type: Sequelize.TEXT,
        allowNull: false,
        references: {
            model: 'smtp_type',
            key: 'name',
        },
        default: 'reset-password',
    });
};

const smtpTextColumnType = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('smtp_text', 'type', {
        type: Sequelize.TEXT,
        allowNull: false,
        references: {
            model: 'smtp_type',
            key: 'name',
        },
        default: 'reset-password',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return smtpType(queryInterface, Sequelize)
          .then(() => queryInterface.sequelize.query('INSERT INTO smtp_type(name) VALUES (\'reset-password\')'))
          .then(() => queryInterface.sequelize.query('INSERT INTO smtp_type(name) VALUES (\'cohort-csv\')'))
          .then(() => smtpColumnType(queryInterface, Sequelize))
          .then(() => smtpTextColumnType(queryInterface, Sequelize));
    },
};
