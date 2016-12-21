'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user_assessment_answer', {
        answerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'answer_id',
            references: {
                model: 'answer',
                key: 'id'
            }
        },
        userAssessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_assessment_id',
            references: {
                model: 'user_assessment',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};
