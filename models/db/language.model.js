'use strict';

const SPromise = require('../../lib/promise');

module.exports = function language(sequelize, Sequelize, schema) {
    const languages = [{
        name: 'English',
        nativeName: 'English',
        code: 'en',
    }, {
        name: 'Russian',
        nativeName: 'Русский',
        code: 'ru',
    }, {
        name: 'Japanese',
        nativeName: '日本語',
        code: 'jp',
    }, {
        name: 'Spanish',
        nativeName: 'Español',
        code: 'es',
    }, {
        name: 'French',
        nativeName: 'Le français',
        code: 'fr',
    }];

    const tableName = 'language';

    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        code: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        nativeName: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'native_name',
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
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const pxs = languages.map(lang => this.create(lang));
                    return SPromise.all(pxs);
                }
                return null;
            },
        },
    });
};
