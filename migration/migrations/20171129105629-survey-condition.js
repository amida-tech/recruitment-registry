'use strict';

const answerSurveyIdColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('answer_rule', 'answer_survey_id', {
        type: Sequelize.INTEGER,
        references: {
            model: {
                tableName: 'survey',
            },
            key: 'id',
        },
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return answerSurveyIdColumn(queryInterface, Sequelize);
    },

    // down: function (queryInterface, Sequelize) {
    // },
};
