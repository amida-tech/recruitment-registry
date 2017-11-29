'use strict';

// const _ = require('lodash');

const Base = require('./base');
const RRError = require('../../lib/rr-error');

const SPromise = require('../../lib/promise');
// const ExportCSVConverter = require('../../export/csv-converter.js');
// const ImportCSVConverter = require('../../import/csv-converter.js');
// const importUtil = require('../../import/import-util');

module.exports = class ChoiceSetDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    createChoiceSetTx({ reference, choices }, transaction) {
        const ChoiceSet = this.db.ChoiceSet;
        return ChoiceSet.create({ reference }, { transaction })
            .then(({ id }) => {
                const type = 'choice';
                const chs = choices.map(ch => Object.assign({ choiceSetId: id, type }, ch));
                return this.questionChoice.createQuestionChoicesTx(chs, transaction)
                    .then(() => ({ id }));
            });
    }

    createChoiceSet(choiceSet) {
        return this.transaction(transaction => this.createChoiceSetTx(choiceSet, transaction));
    }

    createChoiceSets(choiceSets) {
        return this.transaction((transaction) => {
            const promises = choiceSets.map(r => this.createChoiceSetTx(r, transaction));
            return SPromise.all(promises);
        });
    }

    listChoiceSets() {
        const ChoiceSet = this.db.ChoiceSet;
        return ChoiceSet.findAll({
            raw: true,
            attributes: ['id', 'reference'],
            order: ['id'],
        });
    }

    deleteChoiceSet(id) {
        const ChoiceSet = this.db.ChoiceSet;
        return this.transaction((transaction) => {
            const qc = this.questionChoice;
            return qc.deleteAllQuestionChoices(id, transaction)
                .then(() => ChoiceSet.destroy({ where: { id }, transaction }));
        });
    }

    getChoiceSet(id, language) {
        const ChoiceSet = this.db.ChoiceSet;
        return ChoiceSet.findById(id, { raw: true, attributes: ['id', 'reference'] })
            .then(result => this.questionChoice.listQuestionChoices(id, language)
                    .then((choices) => {
                        result.choices = choices; // eslint-disable-line no-param-reassign
                        return result;
                    }));
    }

    getChoiceSetIdByReference(reference, transaction) {
        const ChoiceSet = this.db.ChoiceSet;
        return ChoiceSet.findOne({ where: { reference }, raw: true, attributes: ['id'], transaction })
            .then((record) => {
                if (record) {
                    return record.id;
                }
                return RRError.reject('choiceSetNotFound', reference);
            });
    }
};
