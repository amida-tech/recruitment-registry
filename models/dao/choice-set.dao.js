'use strict';

// const _ = require('lodash');
const db = require('../db');

const RRError = require('../../lib/rr-error');

const sequelize = db.sequelize;
const ChoiceSet = db.ChoiceSet;
const SPromise = require('../../lib/promise');
// const ExportCSVConverter = require('../../export/csv-converter.js');
// const ImportCSVConverter = require('../../import/csv-converter.js');
// const importUtil = require('../../import/import-util');

module.exports = class ChoiceSetDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    createChoiceSetTx({ reference, choices }, transaction) {
        return ChoiceSet.create({ reference }, { transaction })
            .then(({ id }) => this.questionChoice.createQuestionChoices(id, choices, transaction)
                    .then(() => ({ id })));
    }

    createChoiceSet(choiceSet) {
        return sequelize.transaction(transaction => this.createChoiceSetTx(choiceSet, transaction));
    }

    createChoiceSets(choiceSets) {
        return sequelize.transaction((transaction) => {
            const promises = choiceSets.map(choiceSet => this.createChoiceSetTx(choiceSet, transaction));
            return SPromise.all(promises);
        });
    }

    listChoiceSets() {
        return ChoiceSet.findAll({
            raw: true,
            attributes: ['id', 'reference'],
            order: 'id',
        });
    }

    deleteChoiceSet(id) {
        return sequelize.transaction(transaction => this.questionChoice.deleteAllQuestionChoices(id, transaction)
                .then(() => ChoiceSet.destroy({ where: { id }, transaction })));
    }

    getChoiceSet(id, language) {
        return ChoiceSet.findById(id, { raw: true, attributes: ['id', 'reference'] })
            .then(result => this.questionChoice.listQuestionChoices(id, language)
                    .then((choices) => {
                        result.choices = choices;
                        return result;
                    }));
    }

    getChoiceSetIdByReference(reference, transaction) {
        return ChoiceSet.findOne({ where: { reference }, raw: true, attributes: ['id'], transaction })
            .then((record) => {
                if (record) {
                    return record.id;
                }
                return RRError.reject('choiceSetNotFound', reference);
            });
    }

    // exportChoiceSets() {
    //    return this.listChoiceSets()
    //        .then((choiceSets) => {
    //            const choiceSetMap = new Map(choiceSets.map(choiceSet => [choiceSet.id, choiceSet.reference]));
    //            return this.questionChoice.getAllChoiceSetChoices()
    //                .then(choices => {
    //                    choices.forEach(choice => {
    //                        choice.reference = choiceSetMap.get(choice.choiceSetId);
    //                        choice.choiceId = choice.id;
    //                        choice.id = choice.choiceSetId;
    //                        delete choice.choiceSetId;
    //                        const converter = new ExportCSVConverter();
    //                        return converter.dataToCSV(choices);
    //                    });
    //                });
    //        });
    // }

    // importChoiceSets(stream) {
    //    const converter = new ImportCSVConverter();
    //    return converter.streamToRecords(stream)
    //        .then((records) => {
    //            if (!records.length) {
    //                return {};
    //            }
    //            let id = null;
    //            let activeChoiceSet;
    //            const choiceSets = records.reduce((r, record) => {
    //                if (record.id !== id) {
    //                    id = record.id;
    //                    const reference = record.reference;
    //                    activeChoiceSet = {id, reference, choices: []};
    //                    r.push(activeChoiceSet);
    //                }
    //                const { text, code } = record;
    //                activeChoiceSet.choices.push({text, code});
    //                return r;
    //            }, []);
    //            return db.sequelize.transaction((transaction) => {
    //                const idMap = {};
    //                const promises = choiceSets.map((choiceSet) => {
    //                    const recordId = choiceSet.id;
    //                    const record = _.omit(choiceSet, 'id');
    //                    return this.ccreateChoiceSetTx(record, transaction)
    //                        .then(({ id }) => { idMap[recordId] = id; });
    //                });
    //                return SPromise.all(promises).then(() => idMap);
    //            });
    //        });
    // }
};
