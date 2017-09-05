'use strict';

module.exports = function staginBHRGap(sequelize, Sequelize, schema) {
    const tableName = 'staging_bhr_gap';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        username: {
            type: Sequelize.TEXT,
        },
        assessmentName: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'assessment_name',
        },
        status: {
            type: Sequelize.TEXT,
        },
        lineIndex: {
            type: Sequelize.INTEGER,
            field: 'line_index',
        },
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id',
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id',
        },
        multipleIndex: {
            type: Sequelize.INTEGER,
            field: 'multiple_index',
        },
        value: {
            type: Sequelize.TEXT,
        },
        language: {
            type: Sequelize.TEXT,
            field: 'language_code',
            references: {
                model: {
                    schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        lastAnswer: {
            type: Sequelize.BOOLEAN,
            field: 'last_answer',
        },
        daysAfterBaseline: {
            type: Sequelize.INTEGER,
            field: 'days_after_baseline',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: false,
        indexes: [{ fields: ['username', 'assessment_name', 'line_index'] }],
    });
};
