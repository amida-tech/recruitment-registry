'use strict';

module.exports = function sectionText(sequelize, Sequelize, schema) {
    const tableName = 'section_text';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        sectionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'section_id',
            references: {
                model: {
                    schema,
                    tableName: 'section',
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
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        description: {
            type: Sequelize.TEXT,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
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
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
