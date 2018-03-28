'use strict';

const sql = 'INSERT INTO answer_rule_logic (name, created_at) VALUES (\'in-zip-range\', NOW())';

const ruleAnswerValueMetaColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('answer_rule_value', 'meta', {
        type: Sequelize.JSON,
    });
};

module.exports = {
    up(queryInterface) {
        return ruleAnswerValueMetaColumn(queryInterface, sequelize)
            .then(() => queryInterface.sequelize.query(sql));
    },
};
