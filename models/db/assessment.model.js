'use strict';

module.exports = function assessment(sequelize, Sequelize, schema) {
    const tableName = 'assessment';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        stage: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        group: {
            type: Sequelize.TEXT,
            field: 'group',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        indexes: [{
            fields: ['group'],
            where: { deleted_at: { [Op.eq]: null } },
        }],
        paranoid: true,
    });
};
