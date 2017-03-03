'use strict';

module.exports = {
    up: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return sequelize.query('ALTER TABLE answer ALTER COLUMN created_at SET DEFAULT now()')
            .then(() => sequelize.query('ALTER TABLE registry_user ALTER COLUMN created_at SET DEFAULT now()'));
    },

    down: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return sequelize.query('ALTER TABLE answer ALTER COLUMN created_at DROP DEFAULT')
            .then(() => sequelize.query('ALTER TABLE registry_user ALTER COLUMN created_at DROP DEFAULT'));
    }
};
