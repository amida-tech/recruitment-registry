'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('staging_bhr_gap', {
        username: {
            type: DataTypes.TEXT,
        },
        assessmentName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'assessment_name',
        },
        status: {
            type: DataTypes.TEXT,
        },
        lineIndex: {
            type: DataTypes.INTEGER,
            field: 'line_index',
        },
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
        },
        questionChoiceId: {
            type: DataTypes.INTEGER,
            field: 'question_choice_id',
        },
        multipleIndex: {
            type: DataTypes.INTEGER,
            field: 'multiple_index',
        },
        value: {
            type: DataTypes.TEXT,
        },
        language: {
            type: DataTypes.TEXT,
            field: 'language_code',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        lastAnswer: {
            type: DataTypes.BOOLEAN,
            field: 'last_answer',
        },
        daysAfterBaseline: {
            type: DataTypes.INTEGER,
            field: 'days_after_baseline',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        timestamps: false,
        indexes: [{ fields: ['username', 'assessment_name', 'line_index'] }],
    });
};
