'use strict';

const db = require('../db');

const Language = db.Language;

module.exports = class LanguageDAO {
    createLanguage(language) {
        return Language.create(language)
            .then(({ id }) => ({ id }));
    }

    listLanguages() {
        return Language.findAll({
            raw: true,
            attributes: ['code', 'name', 'nativeName'],
            order: 'code',
        });
    }

    patchLanguage(code, languageUpdate) {
        return Language.update(languageUpdate, { where: { code } })
            .then(() => ({}));
    }

    deleteLanguage(code) {
        return Language.destroy({ where: { code } });
    }

    getLanguage(code) {
        return Language.findOne({
            where: { code },
            raw: true,
            attributes: ['code', 'name', 'nativeName'],
        });
    }
};
