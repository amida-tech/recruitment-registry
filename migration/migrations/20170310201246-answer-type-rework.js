'use strict';

const oldAnswerChoices = [
    'zip', 'date', 'year', 'month', 'day', 'bool-sole',
    'integer', 'float', 'pounds', 'feet-inches', 'blood-pressure',
];

const sectionMetaColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('section', 'meta', {
        type: Sequelize.JSON,
    });
};


module.exports = {
    up(queryInterface, Sequelize) {
        return sectionMetaColumn(queryInterface, Sequelize)
            .then(() => queryInterface.sequelize.query('INSERT INTO question_type(name, created_at) VALUES (\'open-choice\', NOW())'))
            .then(() => {
                const choices = oldAnswerChoices.map(r => `'${r}'`);
                const sqlChoices = `(${choices.join(',')})`;
                return queryInterface.sequelize.query(`DELETE FROM answer_type WHERE name IN ${sqlChoices}`);
            });
    },
    // down(queryInterface) {
    //     return queryInterface.removeColumn('section', 'meta');
    // },
};
