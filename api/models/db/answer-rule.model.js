'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule', {
        logic: {
            type: DataTypes.ENUM('equals', 'exists'),
            allowNull: false
        },
        answerChoiceId: {
            type: DataTypes.INTEGER,
            field: 'answer_choice_id',
            references: {
                model: 'question_choice',
                key: 'id'
            }
        },
        answerValue: {
            type: DataTypes.TEXT,
            field: 'answer_value',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};
