'use strict';

const Base = require('./base');
const answerCommon = require('./answer-common');
const RRError = require('../../lib/rr-error');

module.exports = class FilterAnswerDAO extends Base {
    createFilterAnswersTx({ filterId, questions }, transaction) {
        const records = questions.reduce((r, { id: questionId, exclude, answers }) => {
            if (!(answers && answers.length)) {
                throw new RRError('filterMalformedNoAnswers');
            }
            const answerRecords = answerCommon.prepareFilterAnswersForDB(answers);
            const baseRecord = { filterId, questionId };
            if (exclude !== undefined) {
                baseRecord.exclude = exclude;
            }
            answerRecords.forEach((answerRecord) => {
                const record = Object.assign({}, baseRecord);
                record.value = ('value' in answerRecord) ? answerRecord.value : null;
                record.questionChoiceId = answerRecord.questionChoiceId || null;
                r.push(record);
            });
            return r;
        }, []);
        return this.db.FilterAnswer.bulkCreate(records, { transaction });
    }

    getFilterAnswers(filterId) {
        const where = { filterId };
        const order = ['id'];
        return answerCommon.getFilterAnswers(this, this.db.FilterAnswer, { where, order });
    }

    deleteFilterAnswersTx(filterId, transaction) {
        return this.db.FilterAnswer.destroy({ where: { filterId }, transaction });
    }

    deleteFilter(id) {
        return this.transaction(tx => this.deleteFilterTx(id, tx));
    }

    replaceFilterAnswersTx({ filterId, questions }, transaction) {
        return this.deleteFilterAnswersTx(filterId, transaction)
            .then(() => this.createFilterAnswersTx({ filterId, questions }, transaction));
    }
};
