'use strict';

const Base = require('./base');
const answerCommon = require('./answer-common');

module.exports = class FilterAnswerDAO extends Base {
    createFilterAnswersTx({ filterId, questions }, transaction) {
        const records = questions.reduce((r, { id: questionId, answers }) => {
            const answerRecords = answerCommon.prepareFilterAnswersForDB(answers);
            const baseRecord = { filterId, questionId };
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
        const order = this.qualifiedCol('filter_answer', 'id');
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
