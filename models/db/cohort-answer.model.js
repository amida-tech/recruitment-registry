'use strict';

module.exports = function cohortAnswer(sequelize, Sequelize, schema) {
    const tableName = 'cohort_answer';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        cohortId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'cohort_id',
            references: {
                model: {
                    schema,
                    tableName: 'cohort',
                },
                key: 'id',
            },
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: {
                    schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        exclude: {
            type: Sequelize.BOOLEAN,
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id',
            references: {
                model: {
                    schema,
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        value: {
            type: Sequelize.TEXT,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: false,
        indexes: [{ fields: ['cohort_id'] }],
    });
};
