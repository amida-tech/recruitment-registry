'use strict';

const sql = 'INSERT INTO question_type (name) VALUES (\'file\')';

module.exports = {
    up(queryInterface) {
        return queryInterface.sequelize.query(sql);
    },
};
