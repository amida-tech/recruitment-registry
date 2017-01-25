'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule', {
        logic: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'answer_rule_logic',
                key: 'name'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};
