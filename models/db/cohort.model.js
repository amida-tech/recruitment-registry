'use strict';

module.exports = function cohort(sequelize, Sequelize, schema) {
    const tableName = 'cohort';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            unique: true,
            allowNull: false,
        },
        filterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'filter_id',
            references: {
                model: {
                    schema,
                    tableName: 'filter',
                },
                key: 'id',
            },
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
