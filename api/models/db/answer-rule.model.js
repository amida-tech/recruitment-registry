'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule', {
        logic: {
            type: DataTypes.ENUM('equals', 'exists'),
            allowNull: false
        },
        skip: {
            type: DataTypes.INTEGER,
            allowNul: false
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};
