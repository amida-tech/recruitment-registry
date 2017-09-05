'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('assessment_survey', {
        assessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        lookback: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
