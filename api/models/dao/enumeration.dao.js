'use strict';

const db = require('../db');

const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const Enumeration = db.Enumeration;
const SPromise = require('../../lib/promise');

module.exports = class EnumDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createEnumerationTx({ name, enumerals }, transaction) {
        return Enumeration.create({ name }, { transaction })
            .then(({ id }) => {
                return this.enumeral.createEnumerals(id, enumerals, transaction)
                    .then(() => ({ id }));
            });
    }

    createEnumeration(enumeration) {
        return sequelize.transaction(transaction => {
            return this.createEnumerationTx(enumeration, transaction);
        });
    }

    createEnumerations(enumerations) {
        return sequelize.transaction(transaction => {
            const promises = enumerations.map(enumeration => {
                return this.createEnumerationTx(enumeration, transaction);
            });
            return SPromise.all(promises);
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
