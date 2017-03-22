'use strict';

const Base = require('./base');
const answerCommon = require('./answer-common');

module.exports = class FilterAnswerDAO extends Base {
    createFilterAnswersTx({ filterId, questions }, transaction) {
        const records = questions.reduce((r, { id: questionId, answer, answers }) => {
            const answerRecords = this.answer.toDbAnswer(answer || answers);
            const record = { filterId, questionId };
            answerRecords.forEach((answerRecord) => {
                record.value = ('value' in answerRecord) ? answerRecord.value : null;
                record.questionChoiceId = answer.questionChoiceId || null;
            });
            r.push(record);
            return r;
        }, []);
        return this.db.FilterAnswer.bulkCreate(records, { transaction });
    }

    getFilterAnswers(filterId) {
        const attributes = ['questionId', 'questionChoiceId', 'value'];
        return this.db.FilterAnswer.findAll({ raw: true, filterId, attributes, order: 'id' })
            .then((records) => {
                const groupedRecords = records.reduce((r, record) => {
                    const questionId = record.questionId;
                    let questionInfo = r.get(questionId);
                    if (!questionInfo) {
                        const multiple = record['question.multiple'];
                        const type = record['question.type'];
                        questionInfo = { multiple, type, rows: [] };
                        r.set(questionId, questionInfo);
                    }
                    const { questionChoiceId, value } = record;
                    const row = { questionChoiceId, value };
                    if (questionInfo.type === 'choices') {
                        row.choiceType = record['questionChoice.type'];
                    }
                    questionInfo.rows.push(row);
                    return r;
                }, new Map());
                const questions = [];
                groupedRecords.forEach(({ multiple, type, rows }, questionId) => {
                    const question = { questionId };
                    if (multiple) {
                        question.answers = answerCommon.generateAnswer(type, rows, true);
                    } else {
                        question.answer = answerCommon.generateAnswer(type, rows, false);
                    }
                    questions.push(question);
                });
                return questions;
            });
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
