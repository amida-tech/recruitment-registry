'use strict';

const sectionMetaColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('section', 'meta', {
        type: Sequelize.JSON,
    });
};


module.exports = {
    up(queryInterface, Sequelize) {
        return sectionMetaColumn(queryInterface, Sequelize);
    },
    down(queryInterface) {
        return queryInterface.removeColumn('section', 'meta');
    },
};
