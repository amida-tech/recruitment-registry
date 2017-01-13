'use strict';

const db = require('../db');

const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const Enumeration = db.Enumeration;

module.exports = class EnumDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createEnumeration({ name, enumerals }) {
        return sequelize.transaction(transaction => {
            return Enumeration.create({ name }, { transaction })
                .then(({ id }) => {
                    return this.enumeral.createEnumerals(id, enumerals, transaction)
                        .then(() => ({ id }));
                });
        });
    }

    listEnumerations() {
        return Enumeration.findAll({
            raw: true,
            attributes: ['id', 'name'],
            order: 'id'
        });
    }

    deleteEnumeration(id) {
        return sequelize.transaction(transaction => {
            return this.enumeral.deleteAllEnumerals(id, transaction)
                .then(() => Enumeration.destroy({ where: { id }, transaction }));
        });
    }

    getEnumeration(id, language) {
        return Enumeration.findById(id, { raw: true, attributes: ['id', 'name'] })
            .then(result => {
                return this.enumeral.listEnumerals(id, language)
                    .then(enumerals => {
                        result.enumerals = enumerals;
                        return result;
                    });
            });
    }

    getEnumerationIdByName(name, transaction) {
        return Enumeration.findOne({ where: { name }, raw: true, attributes: ['id'], transaction })
            .then(record => {
                if (record) {
                    return record.id;
                }
                return RRError.reject('enumerationNotFound', name);

            });
    }
};
