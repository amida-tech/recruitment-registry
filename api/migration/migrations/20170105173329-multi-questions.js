'use strict';

const multiple = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'multiple', {
        type: Sequelize.BOOLEAN
    });
};

const maxCount = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'max_count', {
        type: Sequelize.INTEGER
    });
};

const multipleIndex = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('answer', 'multiple_index', {
        type: Sequelize.INTEGER
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        return multiple(queryInterface, Sequelize)
            .then(() => maxCount(queryInterface, Sequelize))
            .then(() => multipleIndex(queryInterface, Sequelize));

    },
    down: function (queryInterface) {
        return queryInterface.removeColumn('question', 'max_count')
            .then(() => queryInterface.removeColumn('question', 'multiple'))
            .then(() => queryInterface.removeColumn('answer', 'multiple_index'));
    }
};
