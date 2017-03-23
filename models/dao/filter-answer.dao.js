'use strict';

const Base = require('./base');
const answerCommon = require('./answer-common');

module.exports = class FilterAnswerDAO extends Base {
    createFilterAnswersTx({ filterId, questions }, transaction) {
        const records = questions.reduce((r, { questionId, answers }) => {
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
        const attributes = ['questionId', 'questionChoiceId', 'value'];
        const include = [
            { model: this.db.Question, as: 'question', attributes: ['type'] },
            { model: this.db.QuestionChoice, as: 'questionChoice', attributes: ['type'] },
        ];
        const where = { filterId };
        const order = this.qualifiedCol('filter_answer', 'id');
        const findOptions = { raw: true, where, attributes, include, order };
        return this.db.FilterAnswer.findAll(findOptions)
            .then((records) => {
                const groupedRecords = records.reduce((r, record) => {
                    const questionId = record.questionId;
                    let questionInfo = r.get(questionId);
                    if (!questionInfo) {
                        const type = record['question.type'];
                        questionInfo = { type, rows: [] };
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
                groupedRecords.forEach(({ type, rows }, questionId) => {
                    const question = { questionId };
                    question.answers = answerCommon.generateFilterAnswers(type, rows);
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
