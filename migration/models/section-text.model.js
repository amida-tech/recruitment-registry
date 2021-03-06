'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('section_text', {
        sectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'section_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'section',
                },
                key: 'id',
            },
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        createdAt: {
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
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
