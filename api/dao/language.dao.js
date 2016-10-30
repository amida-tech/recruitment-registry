'use strict';

const models = require('../models');

const Language = models.Language;

module.exports = class {
	constructor() {}

    createLanguage(language) {
        return Language.create(language)
            .then(({ id }) => ({ id }));
    }

    listLanguages() {
        return Language.findAll({
            raw: true,
            attributes: ['code', 'name', 'nativeName'],
            order: 'code'
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
            attributes: ['code', 'name', 'nativeName']
        });
    }
};
