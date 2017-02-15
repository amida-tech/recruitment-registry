'use strict';

const userAudit = function (queryInterface, Sequelize) {
    return queryInterface.createTable('user_audit', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        endpoint: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        operation: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        return userAudit(queryInterface, Sequelize);
    },

    down: function (queryInterface) {
        return queryInterface.dropTable('user_audit');
    }
};
