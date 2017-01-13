'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule', {
        logic: {
            type: DataTypes.ENUM('equals', 'exists', 'not-equals', 'not-exists'),
            allowNull: false
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
