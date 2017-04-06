'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('survey_identifier', {
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: 'identifier',
        },
        identifier: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: 'identifier',
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
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['survey_id'] }],
    });
};
