'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
        const Op = Sequelize.Op;
        return queryInterface.addIndex('question_text', [Sequelize.fn('lower', Sequelize.col('text'))], {
            indexName: 'question_text_lower_text_key',
            where: { deleted_at: { [Op.eq]: null }, language_code: 'en' },
        })
        .then(() => queryInterface.addIndex('question_choice_text', [Sequelize.fn('lower', Sequelize.col('text'))], {
            indexName: 'question_choice_text_lower_text_key',
            where: { deleted_at: { [Op.eq]: null }, language_code: 'en' },
        }));
    },

    // down(queryInterface) {
    //     return queryInterface.removeIndex('question_text', 'question_text_lower_text_key')
    //         .then(() => queryInterface.removeIndex('question_choice_text',
    // 'question_choice_text_lower_text_key'));
    // },
};
