'use strict';

module.exports = function (sequelize, DataTypes) {
    const languages = [{
        name: 'English',
        nativeName: 'English',
        code: 'en'
    }, {
        name: 'Russian',
        nativeName: 'Русский',
        code: 'ru'
    }, {
        name: 'Japanese',
        nativeName: '日本語',
        code: 'jp'
    }, {
        name: 'Spanish',
        nativeName: 'Español',
        code: 'es'
    }, {
        name: 'French',
        nativeName: 'Le français',
        code: 'fr'
    }];

    const Language = sequelize.define('language', {
        code: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        nativeName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'native_name'
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
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const pxs = languages.map(lang => Language.create(lang));
                    return sequelize.Promise.all(pxs);
                }
            }
        },
        classMethods: {
            createLanguage(language) {
                return Language.create(language)
                    .then(({ id }) => ({ id }));
            },
            listLanguages() {
                return Language.findAll({
                    raw: true,
                    attributes: ['code', 'name', 'nativeName'],
                    order: 'code'
                });
            },
            patchLanguage(code, languageUpdate) {
                return Language.update(languageUpdate, { where: { code } })
                    .then(() => ({}));
            },
            deleteLanguage(code) {
                return Language.destroy({ where: { code } });
            },
            getLanguage(code) {
                return Language.findOne({
                    where: { code },
                    raw: true,
                    attributes: ['code', 'name', 'nativeName']
                });
            }
        }
    });

    return Language;
};
