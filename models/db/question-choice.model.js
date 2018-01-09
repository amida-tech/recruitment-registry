'use strict';

module.exports = function questionChoice(sequelize, Sequelize, schema) {
    const tableName = 'question_choice';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id',
            references: {
                model: {
                    schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'answer_type',
                },
                key: 'name',
            },
        },
        code: {
            type: Sequelize.TEXT,
        },
        meta: {
            type: Sequelize.JSON,
        },
        line: {
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
        choiceSetId: {
            type: Sequelize.INTEGER,
            field: 'choice_set_id',
            references: {
                model: {
                    schema,
                    tableName: 'choice_set',
                },
                key: 'id',
            },
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        indexes: [{
            fields: ['question_id'],
            where: { deleted_at: { [Op.eq]: null } },
        }, {
            fields: ['choice_set_id'],
            where: { deleted_at: { [Op.eq]: null } },
        }],
        paranoid: true,
    });
};
