'use strict';

const SPromise = require('../../lib/promise');

module.exports = function Table(sequelize, DataTypes) {
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

    return sequelize.define('language', {
        code: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        nativeName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'native_name',
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
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
