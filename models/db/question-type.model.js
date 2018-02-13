'use strict';

module.exports = function questionType(sequelize, Sequelize, schema) {
    const tableName = 'question_type';
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
                    const names = [
                        'text', 'choice', 'choices', 'bool', 'integer',
                        'float', 'zip', 'date', 'pounds', 'year', 'month',
                        'day', 'feet-inches', 'blood-pressure', 'choice-ref',
                        'open-choice', 'file', 'scale',
                    ];
                    return this.bulkCreate(names.map(name => ({ name })));
                }
                return null;
            },
        },
    });
};
