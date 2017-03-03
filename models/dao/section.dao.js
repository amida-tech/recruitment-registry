'use strict';

const db = require('../db');

const Translatable = require('./translatable');

module.exports = class SectionDAO extends Translatable {
    constructor() {
        super('section_text', 'sectionId', ['name', 'description'], { name: true, description: true });
    }

    createSectionTx(section, transaction) {
        const { type, name, description } = section;
        return db.Section.create({ type }, { transaction })
            .then(({ id }) => {
                if (name) {
                    return this.createTextTx({ name, description, id }, transaction);
                } else {
                    return { id };
                }
            });
    }
};
