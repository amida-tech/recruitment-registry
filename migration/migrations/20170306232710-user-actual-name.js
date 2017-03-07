'use strict';

const userFirstnameColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('registry_user', 'firstname', {
        type: Sequelize.TEXT,
    });
};

const userLastnameColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('registry_user', 'lastname', {
        type: Sequelize.TEXT,
    });
};


module.exports = {
    up(queryInterface, Sequelize) {
        return userFirstnameColumn(queryInterface, Sequelize)
            .then(() => userLastnameColumn);
    },
    down(queryInterface) {
        return queryInterface.removeColumn('registry_user', 'lastname')
            .then(() => queryInterface.removeColumn('registry_user', 'firstname'));
    },
};
