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

const userInstitutionColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('registry_user', 'institution', {
        type: Sequelize.TEXT,
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return userFirstnameColumn(queryInterface, Sequelize)
            .then(() => userLastnameColumn(queryInterface, Sequelize))
            .then(() => userInstitutionColumn(queryInterface, Sequelize));
    },
    // down(queryInterface) {
    //     return queryInterface.removeColumn('registry_user', 'lastname')
    //         .then(() => queryInterface.removeColumn('registry_user', 'firstname'))
    //         .then(() => queryInterface.removeColumn('registry_user', 'institution'));
    // },
};
