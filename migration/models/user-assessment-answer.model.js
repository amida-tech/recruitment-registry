'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('user_assessment_answer', {
        answerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'answer_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'answer',
                },
                key: 'id',
            },
        },
        userAssessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_assessment_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'user_assessment',
                },
                key: 'id',
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};
