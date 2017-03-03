'use strict';

module.exports = {
    up: function (queryInterface) {
        return queryInterface.dropTable('question_action_text')
            .then(() => queryInterface.dropTable('question_action'));
    },

    down: function () {
        //const sequelize = queryInterface.sequelize;
        //return queryInterface.renameTable('survey_section_text', 'section_text')
        //  .then(() => queryInterface.dropTable('survey_section_question'));
    }
};
