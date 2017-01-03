'use strict';

const db = require('../db');
const RRError = require('../../lib/rr-error');

const AnswerIdentifier = db.AnswerIdentifier;
const Question = db.Question;
const QuestionChoice = db.QuestionChoice;

module.exports = class QuestionIdentifierDAO {
    constructor() {}

    getIdsByAnswerIdentifier(type, identifier) {
        return AnswerIdentifier.findOne({
                where: { type, identifier },
                attributes: ['questionId', 'questionChoiceId'],
                raw: true
            })
            .then(ids => {
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
                raw: true
            })
            .then(records => {
                return records.reduce((r, record) => {
                    const questionChoiceId = record.questionChoiceId;
                    const key = record.questionId + (questionChoiceId ? (':' + questionChoiceId) : '');
                    r[key] = { identifier: record.identifier, tag: record.tag };
                    return r;
                }, {});
            });
    }

    getAnswerIdentifierToIdsMap(type) {
        return AnswerIdentifier.findAll({
                where: { type },
                attributes: ['identifier', 'questionId', 'questionChoiceId'],
                include: [{
                    model: Question,
                    as: 'question',
                    attributes: ['type']
                }, {
                    model: QuestionChoice,
                    as: 'questionChoice',
                    attributes: ['type']
                }],
                raw: true
            })
            .then(records => {
                return records.reduce((r, record) => {
                    const identifier = record.identifier;
                    r[identifier] = {
                        questionId: record.questionId,
                        questionType: record['question.type'],
                        questionChoiceId: record.questionChoiceId,
                        questionChoiceType: record['questionChoice.type']
                    };
                    return r;
                }, {});
            });
    }
};
