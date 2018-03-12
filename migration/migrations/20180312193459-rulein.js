'use strict';

const sql = 'INSERT INTO answer_rule_logic (name, created_at) VALUES (\'in\', NOW())';

module.exports = {
    up: function (queryInterface) {
        return queryInterface.sequelize.query(sql);
    },
};
