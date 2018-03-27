'use strict';

const sql = 'INSERT INTO answer_rule_logic (name, created_at) VALUES (\'in-zip-range\', NOW())';

module.exports = {
    up(queryInterface) {
        return queryInterface.sequelize.query(sql);
    },
};
