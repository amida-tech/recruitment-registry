'use strict';

const db = require('../db');

const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const ChoiceSet = db.ChoiceSet;
const SPromise = require('../../lib/promise');

module.exports = class ChoiceSetDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createChoiceSetTx({ reference, choices }, transaction) {
        return ChoiceSet.create({ reference }, { transaction })
            .then(({ id }) => {
                return this.questionChoice.createQuestionChoices(id, choices, transaction)
                    .then(() => ({ id }));
            });
    }

    createChoiceSet(choiceSet) {
        return sequelize.transaction(transaction => {
            return this.createChoiceSetTx(choiceSet, transaction);
        });
    }

    createChoiceSets(choiceSets) {
        return sequelize.transaction(transaction => {
            const promises = choiceSets.map(choiceSet => {
                return this.createChoiceSetTx(choiceSet, transaction);
            });
            return SPromise.all(promises);
        });
    }

    listChoiceSets() {
        return ChoiceSet.findAll({
            raw: true,
            attributes: ['id', 'reference'],
            order: 'id'
        });
    }

    deleteChoiceSet(id) {
        return sequelize.transaction(transaction => {
            return this.questionChoice.deleteAllQuestionChoices(id, transaction)
                .then(() => ChoiceSet.destroy({ where: { id }, transaction }));
        });
    }

    getChoiceSet(id, language) {
        return ChoiceSet.findById(id, { raw: true, attributes: ['id', 'reference'] })
            .then(result => {
                return this.questionChoice.listQuestionChoices(id, language)
                    .then(choices => {
                        result.choices = choices;
                        return result;
                    });
            });
    }

    getChoiceSetIdByReference(reference, transaction) {
        return ChoiceSet.findOne({ where: { reference }, raw: true, attributes: ['id'], transaction })
            .then(record => {
                if (record) {
                    return record.id;
                }
                return RRError.reject('choiceSetNotFound', reference);

            });
    }
};
