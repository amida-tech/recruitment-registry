'use strict';

module.exports = {
    up: function (queryInterface) {
        return queryInterface.removeColumn('consent_document', 'deleted_at')
            .then(() => queryInterface.removeColumn('consent_document_text', 'deleted_at'))
            .then(() => queryInterface.renameColumn('question_choice_text', 'question_choice_text', 'question_choice_id'))
            .then(() => queryInterface.renameColumn('question_action_text', 'question_action_text', 'question_action_id'))
            .then(() => queryInterface.renameColumn('consent_document', 'deletedAt', 'deleted_at'))
            .then(() => queryInterface.renameColumn('consent_document_text', 'deletedAt', 'deleted_at'));

    },
    down: function (queryInterface, Sequelize) {
        return queryInterface.renameColumn('consent_document', 'deleted_at', 'deletedAt')
            .then(() => queryInterface.renameColumn('consent_document_text', 'deleted_at', 'deletedAt'))
            .then(() => queryInterface.renameColumn('question_choice_text', 'question_choice_id', 'question_choice_text'))
            .then(() => queryInterface.renameColumn('question_action_text', 'question_action_id', 'question_action_text'))
            .then(() => queryInterface.addColumn('consent_document', 'question_id', {
                type: Sequelize.DATE,
            }))
            .then(() => queryInterface.addColumn('consent_document', 'question_id', {
                type: Sequelize.DATE,
            }));
    }
};
