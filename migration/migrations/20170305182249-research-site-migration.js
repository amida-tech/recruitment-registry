'use strict';

const researchSite = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('research_site', 'street', {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'street',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return researchSite(queryInterface, Sequelize);
    },
    down() {

    },
};
