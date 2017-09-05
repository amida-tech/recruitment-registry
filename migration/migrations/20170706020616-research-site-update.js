'use strict';

const phone = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'phone', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '999-999-9999',
        field: 'phone',
    });
};

const ext = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'ext', {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'ext',
    });
};

const phone2 = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'phone2', {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'phone2',
    });
};

const ext2 = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'ext2', {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'ext2',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return phone(queryInterface, Sequelize)
        .then(() => ext(queryInterface, Sequelize))
        .then(() => phone2(queryInterface, Sequelize))
        .then(() => ext2(queryInterface, Sequelize));
    },
    // down() {
    // },
};
