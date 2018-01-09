'use strict';

module.exports = function answer(sequelize, Sequelize, schema) {
    const tableName = 'answer';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        surveyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: {
                    schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        language: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema,
                    tableName: 'language',
                },
                key: 'code',
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
        fileId: {
            type: Sequelize.INTEGER,
            field: 'file_id',
            references: {
                model: {
                    schema,
                    tableName: 'file',
                },
                key: 'id',
            },
        },
        multipleIndex: {
            type: Sequelize.INTEGER,
            field: 'multiple_index',
        },
        value: {
            type: Sequelize.TEXT,
        },
        meta: {
            type: Sequelize.JSON,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
            defaultValue: sequelize.literal('NOW()'),
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        assessmentId: {
            type: Sequelize.INTEGER,
            field: 'assessment_id',
            references: {
                model: {
                    schema,
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{
            fields: ['survey_id'], where: { deleted_at: { [Op.eq]: null } },
        }, {
            fields: ['assessment_id'], where: { deleted_at: { [Op.eq]: null } },
        }, {
            fields: ['user_id'], where: { deleted_at: { [Op.eq]: null } },
        }],
    });
};
