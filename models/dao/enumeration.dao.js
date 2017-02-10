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

    createEnumerationTx({ reference, choices }, transaction) {
        return Enumeration.create({ reference }, { transaction })
            .then(({ id }) => {
                return this.questionChoice.createQuestionChoices(id, choices, transaction)
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
            attributes: ['id', 'reference'],
            order: 'id'
        });
    }

    deleteEnumeration(id) {
        return sequelize.transaction(transaction => {
            return this.questionChoice.deleteAllQuestionChoices(id, transaction)
                .then(() => Enumeration.destroy({ where: { id }, transaction }));
        });
    }

    getEnumeration(id, language) {
        return Enumeration.findById(id, { raw: true, attributes: ['id', 'reference'] })
            .then(result => {
                return this.questionChoice.listQuestionChoices(id, language)
                    .then(choices => {
                        result.choices = choices;
                        return result;
                    });
            });
    }

    getEnumerationIdByReference(reference, transaction) {
        return Enumeration.findOne({ where: { reference }, raw: true, attributes: ['id'], transaction })
            .then(record => {
                if (record) {
                    return record.id;
                }
                return RRError.reject('enumerationNotFound', reference);

            });
    }
};
