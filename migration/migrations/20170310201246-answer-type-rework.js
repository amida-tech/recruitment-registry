'use strict';

const _ = require('lodash');

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
            });
    },
    down(queryInterface) {
        return queryInterface.removeColumn('section', 'meta');
    },
};
