'use strict';

module.exports = function (sequelize, DataTypes) {
    const QuestionAction = sequelize.define('question_action', {
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            allowNull: false,
            references: {
                model: 'question',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        line: {
            type: DataTypes.INTEGER
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        classMethods: {}
    });

    return QuestionAction;
};
