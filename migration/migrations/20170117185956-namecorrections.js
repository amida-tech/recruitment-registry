'use strict';

module.exports = {
    up: function (queryInterface) {
        return queryInterface.removeColumn('consent_document', 'deleted_at')
            .then(() => queryInterface.sequelize.query('ALTER TABLE question_choice_text DROP CONSTRAINT question_choice_text_question_choice_text_fkey'))
            .then(() => queryInterface.removeColumn('consent_document_text', 'deleted_at'))
            .then(() => queryInterface.renameColumn('question_choice_text', 'question_choice_text', 'question_choice_id'))
            .then(() => queryInterface.renameColumn('consent_document', 'deletedAt', 'deleted_at'))
            .then(() => queryInterface.renameColumn('consent_document_text', 'deletedAt', 'deleted_at'))
            .then(() => queryInterface.sequelize.query('ALTER TABLE answer ADD CONSTRAINT answer_language_code_fkey FOREIGN KEY (language_code) REFERENCES language'))
            .then(() => queryInterface.sequelize.query('ALTER TABLE consent_signature ADD CONSTRAINT consent_signature_language_code_fkey FOREIGN KEY (language_code) REFERENCES language'))
            .then(() => queryInterface.sequelize.query('ALTER TABLE staging_bhr_gap ADD CONSTRAINT staging_bhr_gap_language_code_fkey FOREIGN KEY (language_code) REFERENCES language'))
            .then(() => queryInterface.sequelize.query('ALTER TABLE question_choice_text ADD CONSTRAINT question_choice_text_question_choice_id_fkey FOREIGN KEY (question_choice_id) REFERENCES question_choice'));
    },
    down: function (queryInterface, Sequelize) {
        return queryInterface.renameColumn('consent_document', 'deleted_at', 'deletedAt')
            .then(() => queryInterface.renameColumn('consent_document_text', 'deleted_at', 'deletedAt'))
            .then(() => queryInterface.renameColumn('question_choice_text', 'question_choice_id', 'question_choice_text'))
            .then(() => queryInterface.addColumn('consent_document', 'question_id', {
                type: Sequelize.DATE,
            }))
            .then(() => queryInterface.addColumn('consent_document', 'question_id', {
                type: Sequelize.DATE,
            }));
    }
};
