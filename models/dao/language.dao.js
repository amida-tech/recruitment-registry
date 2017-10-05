'use strict';

const Base = require('./base');

module.exports = class LanguageDAO extends Base {
    createLanguage(language) {
        return this.db.Language.create(language)
            .then(({ id }) => ({ id }));
    }

    listLanguages() {
        return this.db.Language.findAll({
            raw: true,
            attributes: ['code', 'name', 'nativeName'],
            order: ['code'],
        });
    }

    patchLanguage(code, languageUpdate) {
        return this.db.Language.update(languageUpdate, { where: { code } })
            .then(() => ({}));
    }

    deleteLanguage(code) {
        return this.db.Language.destroy({ where: { code } });
    }

    getLanguage(code) {
        return this.db.Language.findOne({
            where: { code },
            raw: true,
            attributes: ['code', 'name', 'nativeName'],
        });
    }
};
