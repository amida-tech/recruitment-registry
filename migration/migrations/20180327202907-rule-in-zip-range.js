'use strict';

const sql = 'INSERT INTO answer_rule_logic (name, created_at) VALUES (\'in-zip-range\', NOW())';

const ruleAnswerValueMetaColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('answer_rule_value', 'meta', {
        type: Sequelize.JSON,
    });
};

module.exports = {
    up(queryInterface) {
        return queryInterface.sequelize.query(sql).
        then(() => ruleAnswerValueMetaColumn(queryInterface, sequelize));
    },
};
