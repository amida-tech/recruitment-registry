'use strict';

module.exports = function smtpType(sequelize, Sequelize, schema) {
    const tableName = 'smtp_type';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const names = ['reset-password', 'cohort-csv'];
                    return this.bulkCreate(names.map(name => ({ name })));
                }
                return null;
            },
        },
    });
};
