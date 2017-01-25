'use strict';

const meta = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question_choice', 'meta', {
        type: Sequelize.JSON
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        return meta(queryInterface, Sequelize);

    },
    down: function (queryInterface) {
        return queryInterface.removeColumn('question_choice', 'meta');
    }
};
