'use strict';

const researchSiteStreet = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'street', {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'street',
    });
};

const researchSiteStreet2 = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'street2', {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'street2',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return researchSiteStreet(queryInterface, Sequelize)
            .then(() => researchSiteStreet2(queryInterface, Sequelize));
    },
    // down() {
    // },
};
