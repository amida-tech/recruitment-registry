'use strict';

const _ = require('lodash');

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
            .then(() => {
                const QuestionType = _.get(queryInterface, 'sequelize.models.question_type');
                return QuestionType.create({ name: 'open-choice' });
            })
            .then(() => {
                const AnswerType = _.get(queryInterface, 'sequelize.models.answer_type');
                const types = oldAnswerChoices.map(type => ({ name: type }));
                return AnswerType.destroy({ where: { $or: types } });
            });
    },
    down(queryInterface) {
        return queryInterface.removeColumn('section', 'meta');
    },
};
