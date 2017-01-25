'use strict';

module.exports = {
    up: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return sequelize.query('ALTER TYPE enum_registry_user_role ADD VALUE \'import\'');
    },

    down: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return sequelize.query('DELETE FROM pg_enum WHERE pg_enum.enumlabel = \'import\' AND pg_enum.enumtypid IN (SELECT oid FROM pg_type WHERE pg_type.typname = \'enum_registry_user_role\')');
    }
};
