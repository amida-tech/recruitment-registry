'use strict';

module.exports = function question(sequelize, Sequelize, schema) {
    const tableName = 'question';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'question_type',
                },
                key: 'name',
            },
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
        version: {
            type: Sequelize.INTEGER,
        },
        groupId: {
            type: Sequelize.INTEGER,
            field: 'group_id',
        },
        meta: {
            type: Sequelize.JSON,
        },
        multiple: {
            type: Sequelize.BOOLEAN,
        },
        maxCount: {
            type: Sequelize.INTEGER,
            field: 'max_count',
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        common: {
            type: Sequelize.BOOLEAN,
        },
        isIdentifying: {
            type: Sequelize.BOOLEAN,
            field: 'is_identifying',
            allowNull: false,
            defaultValue: false,
        },
        parameter: {
            type: Sequelize.TEXT,
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
