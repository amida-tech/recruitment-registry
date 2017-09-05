'use strict';

module.exports = function answerIdentifier(sequelize, Sequelize, schema) {
    const tableName = 'answer_identifier';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: 'identifier',
        },
        identifier: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: 'identifier',
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
        multipleIndex: {
            type: Sequelize.INTEGER,
            field: 'multiple_index',
        },
        tag: {
            type: Sequelize.INTEGER,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['question_id', 'question_choice_id'] }],
    });
};
