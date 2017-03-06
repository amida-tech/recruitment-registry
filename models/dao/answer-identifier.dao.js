'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');

const AnswerIdentifier = db.AnswerIdentifier;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;

module.exports = class QuestionIdentifierDAO {
    createAnswerIdentifier(answerIdentifier, transaction) {
        return AnswerIdentifier.create(answerIdentifier, { transaction })
            .then(({ id }) => ({ id }));
    }

    getIdsByAnswerIdentifier(type, identifier) {
        return AnswerIdentifier.findOne({
            where: { type, identifier },
            attributes: ['questionId', 'questionChoiceId'],
            raw: true,
        })
            .then((ids) => {
                if (!ids) {
                    return RRError.reject('answerIdentifierNotFound');
                }
                if (ids.questionChoiceId === null) {
                    delete ids.questionChoiceId;
                }
                return ids;
            });
    }

    getAnswerIdsToIdentifierMap(type) {
        return AnswerIdentifier.findAll({
            where: { type },
            attributes: ['identifier', 'questionId', 'questionChoiceId', 'tag'],
            raw: true,
        })
            .then(records => records.reduce((r, record) => {
                const questionChoiceId = record.questionChoiceId;
                const key = record.questionId + (questionChoiceId ? (`:${questionChoiceId}`) : '');
                r[key] = { identifier: record.identifier, tag: record.tag };
                return r;
            }, {}));
    }

    getTypeInformationByAnswerIdentifier(type) {
        return AnswerIdentifier.findAll({
            where: { type },
            attributes: ['identifier', 'questionId', 'multipleIndex', 'questionChoiceId'],
            include: [{
                model: Question,
                as: 'question',
                attributes: ['type'],
            }, {
                model: QuestionChoice,
                as: 'questionChoice',
                attributes: ['type'],
            }],
            raw: true,
        })
            .then(records => records.reduce((r, record) => {
                const identifier = record.identifier;
                r.set(identifier, {
                    questionId: record.questionId,
                    questionType: record['question.type'],
                    multipleIndex: record.multipleIndex,
                    questionChoiceId: record.questionChoiceId,
                    questionChoiceType: record['questionChoice.type'],
                });
                return r;
            }, new Map()));
    }

    getIdentifiersByAnswerIds(type) {
        return AnswerIdentifier.findAll({
            where: { type },
            attributes: ['identifier', 'questionId', 'multipleIndex', 'questionChoiceId'],
            include: [{
                model: Question,
                as: 'question',
                attributes: ['type', 'multiple'],
            }, {
                model: QuestionChoice,
                as: 'questionChoice',
                attributes: ['type'],
            }],
            raw: true,
        })
            .then((records) => {
                const map = records.reduce((r, record) => {
                    const identifier = record.identifier;
                    const questionId = record.questionId;
                    if (!((record['question.type'] === 'choices') || record['question.multiple'])) {
                        r.set(questionId, identifier);
                        return r;
                    }
                    let mapByQuestionId = r.get(questionId);
                    if (!mapByQuestionId) {
                        mapByQuestionId = new Map();
                        r.set(questionId, mapByQuestionId);
                    }
                    if (record['question.multiple']) {
                        mapByQuestionId.set(record.multipleIndex, identifier);
                        return r;
                    }
                    mapByQuestionId.set(record.questionChoiceId, identifier);
                    return r;
                }, new Map());
                const identifiers = records.map(record => record.identifier);
                return { identifiers, map };
            });
    }

    getMapByQuestionId(type, ids) {
        return AnswerIdentifier.findAll({
            where: { type, questionId: { $in: ids } },
            attributes: ['identifier', 'questionId', 'questionChoiceId'],
            include: [{ model: Question, as: 'question', attributes: ['type'] }],
            raw: true,
        })
            .then(records => records.reduce((r, record) => {
                if (record['question.type'] === 'choice') {
                    let list = r.get(record.questionId);
                    if (!list) {
                        list = [];
                        r.set(record.questionId, list);
                    }
                    list.push(record);
                    return r;
                }
                if (record['question.type'] === 'choices') {
                    let map = r.get(record.questionId);
                    if (!map) {
                        map = new Map();
                        r.set(record.questionId, map);
                    }
                    map.set(record.questionChoiceId, record.identifier);
                    return r;
                }
                r.set(record.questionId, record.identifier);
                return r;
            }, new Map()));
    }
};
