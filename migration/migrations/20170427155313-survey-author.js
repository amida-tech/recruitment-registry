'use strict';

const surveyAuthorIdColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey', 'author_id', {
        type: Sequelize.INTEGER,
        references: {
            model: 'registry_user',
            key: 'id',
        },
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return surveyAuthorIdColumn(queryInterface, Sequelize)
            .then(() => {
                const query = 'UPDATE survey SET author_id = 1';
                return queryInterface.sequelize.query(query);
            });
    },
    // down(queryInterface) {
    //     return queryInterface.removeColumn('survey', 'author_id');
    // },
};
