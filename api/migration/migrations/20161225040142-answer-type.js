'use strict';

const answerType = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('answer', 'type', {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'answer_type_id',
        references: {
            model: 'answer_type',
            key: 'name'
        }
    });
};

module.exports = {
    up: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return queryInterface.removeColumn('answer', 'answer_type_id')
            .then(() => sequelize.query('UPDATE answer_type SET name = \'pounds\' WHERE name = \'number\''))
            .then(() => sequelize.query('UPDATE answer_type SET name = \'feet-inches\' WHERE name = \'dual-integers\''))
            .then(() => sequelize.query('INSERT INTO answer_type (name) VALUES (\'bool-sole\')'))
            .then(() => sequelize.query('INSERT INTO answer_type (name) VALUES (\'blood-pressure\')'))
            .then(() => sequelize.query('INSERT INTO answer_type (name) VALUES (\'zip\')'))
            .then(() => sequelize.query('INSERT INTO question_type (name) VALUES (\'float\')'))
            .then(() => sequelize.query('INSERT INTO answer_type (name) VALUES (\'float\')'));
    },

    down: function (queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;
        return answerType(queryInterface, Sequelize) // TODO: repopoulate answer type based on question, question_choice type
            .then(() => sequelize.query('UPDATE answer_type SET name = \'number\' WHERE name = \'pounds\''))
            .then(() => sequelize.query('UPDATE answer_type SET name = \'dual-integers\' WHERE name = \'feet-inches\''))
            .then(() => sequelize.query('DELETE FROM answer_type WHERE name = \'bool-sole\''))
            .then(() => sequelize.query('DELETE FROM answer_type WHERE name = \'blood-pressure\''))
            .then(() => sequelize.query('DELETE FROM answer_type WHERE name = \'float\''))
            .then(() => sequelize.query('DELETE FROM question_type WHERE name = \'float\''))
            .then(() => sequelize.query('DELETE FROM answer_type WHERE name = \'zip\''));
    }
};
